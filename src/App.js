import React, { useState, useEffect } from 'react';
import SongView from './components/SongView';
import SongList from './components/SongList';
import './App.css';

function App() {
  const [tunes, setTunes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTune, setSelectedTune] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // New states for menu and book selection
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null); // null means "All Books"
  const [books, setBooks] = useState([]);

  // Load All Tunes from Library and Book Metadata
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/library/library.json')
      .then(res => res.json())
      .then(data => {
        const booksData = data.books || [];
        // Load book metadata (title, theme, logo) for the menu
        const bookMetadataPromises = booksData.map(book =>
          fetch(process.env.PUBLIC_URL + book.path)
            .then(res => res.json())
            .then(bookData => ({
              id: book.id,
              title: bookData.title,
              theme: bookData.theme,
              logo: bookData.logo
            }))
        );
        return Promise.all(bookMetadataPromises).then(loadedBooks => {
          setBooks(loadedBooks);
          // Now load tunes as before
          const allTunePromises = booksData.map(book =>
            fetch(process.env.PUBLIC_URL + book.path)
              .then(res => res.json())
              .then(bookData => {
                const songPromises = bookData.songs.map(songId =>
                  fetch(process.env.PUBLIC_URL + book.path.replace('book.json', `songs/${songId}.abc`))
                    .then(res => res.text())
                    .then(abcText => {
                      const titleMatch = abcText.match(/^T:\s*(.+)/m);
                      return {
                        id: `${book.id}-${songId}`,
                        title: titleMatch ? titleMatch[1] : 'Untitled',
                        abc: abcText,
                        book: bookData.title
                      };
                    })
                );
                return Promise.all(songPromises);
              })
          );
          return Promise.all(allTunePromises);
        });
      })
      .then(allTunes => {
        setTunes(allTunes.flat());
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error loading library:", err);
        setIsLoading(false);
      });
  }, []);

  // Updated filtering: include search and book selection
  const filteredTunes = tunes.filter(tune =>
    tune.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!selectedBook || tune.book === selectedBook.title)
  );

  const handleBackToSearch = () => {
    setSelectedTune(null);
  };

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Updated header with dynamic background and menu button */}
      <header className="App-header" style={{ backgroundColor: selectedBook ? selectedBook.theme.background : '#282c34' }}>
        <div className="App-title">
          {selectedBook ? (
            <>
              <img
                src={process.env.PUBLIC_URL + selectedBook.logo}
                alt={selectedBook.title}
                className="App-logo"
              />
              <div className="App-title-text">{selectedBook.title}</div>
            </>
          ) : (
            <>
              <img
                src={process.env.PUBLIC_URL + '/logo192.png'}
                alt="Hymnus logo"
                className="App-logo"
              />
              <div className="App-title-text">Hymnus</div>
            </>
          )}
        </div>
        {/* Hamburger menu button */}
        <button className="App-menu-button" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      </header>
      {/* Menu overlay when open */}
      {menuOpen && (
        <div className="App-menu">
          <div className="App-menu-header">Library</div>
          <div className="App-books">
            {/* "All Books" option to reset filter */}
            <div className="App-book-item" onClick={() => { setSelectedBook(null); setMenuOpen(false); }}>
              All Books
            </div>
            {/* List of books with logos */}
            {books.map(book => (
              <div key={book.id} className="App-book-item" onClick={() => { setSelectedBook(book); setMenuOpen(false); }}>
                <img src={process.env.PUBLIC_URL + book.logo} alt={book.title} className="App-book-logo" />
                {book.title}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="App-main" style={{ padding: '20px' }}>
        {/* Search Bar - Always Visible */}
        <input
          className="App-search-input"
          type="text"
          placeholder="Search songs..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        {/* Conditional Content: Results or Player */}
        {selectedTune ? (
          <SongView tune={selectedTune} onBack={handleBackToSearch} />
        ) : (
          <SongList 
            isLoading={isLoading} 
            tunes={filteredTunes} 
            onSelect={setSelectedTune} 
          />
        )}
      </div>
    </div>
  );
}

export default App;