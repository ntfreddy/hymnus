import React, { useState, useEffect } from 'react';
import SongView from './components/SongView';
import SongList from './components/SongList';
import './App.css';

function App() {
  const [tunes, setTunes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTune, setSelectedTune] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load All Tunes from Library
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/library/library.json')
      .then(res => res.json())
      .then(data => {
        const books = data.books || [];
        const allTunePromises = books.map(book =>
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

  const filteredTunes = tunes.filter(tune =>
    tune.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBackToSearch = () => {
    setSelectedTune(null);
  };

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header className="App-header" style={{ padding: '1rem', background: '#282c34', color: 'white' }}>
        <h2>Hymnos Library</h2>
      </header>
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        {/* Search Bar - Always Visible */}
        <input
          style={{ padding: '10px', marginBottom: '20px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }}
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