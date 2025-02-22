import React, { useEffect } from 'react';

interface ControlsProps {
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onPlay, onPause, onStop }) => {
  useEffect(() => {
    // Obsługa klawiatury dla sterowania odtwarzaniem wideo
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        onPlay();
      } else if (event.code === 'KeyS') {
        onStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onPlay, onStop]);

  return (
    <div className="controls-container">
      {/* Przycisk sterowania odtwarzaniem */}
      <button onClick={onPlay}>Play</button>
      <button onClick={onPause}>Pause</button>
      <button onClick={onStop}>Stop</button>
    </div>
  );
};

export default Controls;