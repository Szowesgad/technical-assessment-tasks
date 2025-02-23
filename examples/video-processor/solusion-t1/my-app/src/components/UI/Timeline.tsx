import React from 'react';

interface TimelineProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ duration, currentTime, onSeek }) => {
  return (
    <div className="timeline-container">
      {/* Wyświetlanie aktualnego czasu oraz całkowitej długości wideo */}
      <span>{new Date(currentTime * 1000).toISOString().substr(14, 5)} / {new Date(duration * 1000).toISOString().substr(14, 5)}</span>
      {/* Suwak do przewijania wideo */}
      <input
        type="range"
        min={0}
        max={duration}
        value={currentTime}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
      />
    </div>
  );
};

export default Timeline;
