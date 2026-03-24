import React, { useState, useEffect, useRef } from 'react';
import abcjs from 'abcjs';
import 'abcjs/abcjs-audio.css';
import './App.css';

function App() {
  const [tunes, setTunes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTune, setSelectedTune] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const paperRef = useRef(null);
  const audioRef = useRef(null);
  const synthControlRef = useRef(null);

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

  // Render and Initialize Player (unchanged, but now for selectedTune)
  useEffect(() => {
    if (!selectedTune || !paperRef.current) return;

    // 1. Visualize
    const visualObj = abcjs.renderAbc(paperRef.current, selectedTune.abc, { responsive: 'resize' });

    // 2. Audio Player
    if (abcjs.synth.supportsAudio()) {
      const synthControl = new abcjs.synth.SynthController();
      synthControl.load(audioRef.current, null, {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: true
      });

      const createSynth = new abcjs.synth.CreateSynth();
      createSynth.init({ visualObj: visualObj[0] }).then(() => {
        synthControl.setTune(visualObj[0], false).then(() => {
          // Audio loaded successfully
        }).catch(error => console.warn("Audio load error:", error));
      }).catch(error => console.warn("Audio init error:", error));

      synthControlRef.current = synthControl;
    }
  }, [selectedTune]);

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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <button onClick={handleBackToSearch} style={{ alignSelf: 'flex-start', marginBottom: '10px' }}>
              Back to Search
            </button>
            <div ref={audioRef} style={{ marginBottom: '10px' }}></div>
            <div ref={paperRef} style={{ flex: 1 }}></div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', color: '#888' }}>Loading songs...</div>
            ) : filteredTunes.length > 0 ? (
              filteredTunes.map(tune => (
                <div
                  key={tune.id}
                  onClick={() => setSelectedTune(tune)}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    background: '#f9f9f9',
                    marginBottom: '5px'
                  }}
                >
                  <strong>{tune.title}</strong> (from {tune.book})
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#888' }}>
                No songs found. Try a different search term.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;