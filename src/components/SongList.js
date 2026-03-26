import React from 'react';

function SongList({ isLoading, tunes, onSelect }) {
  if (isLoading) {
    return <div style={{ textAlign: 'center', color: '#888' }}>Loading songs...</div>;
  }

  if (tunes.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#888' }}>
        No songs found. Try a different search term.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {tunes.map(tune => (
        <div
          key={tune.id}
          onClick={() => onSelect(tune)}
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
      ))}
    </div>
  );
}

export default SongList;