import React, { useEffect, useRef } from 'react';
import abcjs from 'abcjs';
import 'abcjs/abcjs-audio.css';

function SongView({ tune, onBack, theme }) {
  const paperRef = useRef(null);
  const audioRef = useRef(null);
  const synthControlRef = useRef(null);

  useEffect(() => {
    if (!tune || !paperRef.current) return;

    // 1. Visualize
    const visualObj = abcjs.renderAbc(paperRef.current, tune.abc, { responsive: 'resize' });

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

    // Clean up synth on unmount
    return () => {
      if (synthControlRef.current) {
        synthControlRef.current.destroy();
      }
    };
  }, [tune]);

  return (
    <div 
      style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%', 
        overflowX: 'hidden', 
        boxSizing: 'border-box' 
      }}>
      <button 
        onClick={onBack} 
        style={{ 
          alignSelf: 'flex-start', 
          marginBottom: '10px', 
          fontSize: '24px', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          color: theme?.text || 'inherit',
          paddingLeft: '10px',
          paddingTop: '10px'
        }}
      >
        ←
      </button>
      <div ref={audioRef} style={{ marginBottom: '10px', width: '100%' }}></div>
      <div 
        ref={paperRef} 
        style={{ 
          flex: 1, 
          background: 'white', 
          padding: '10px', 
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%'
        }}
      ></div>
    </div>
  );
}

export default SongView;