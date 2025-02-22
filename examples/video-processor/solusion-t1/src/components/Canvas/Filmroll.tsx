import React from 'react';
import { FrameData } from '../VideoProcessor';

interface FilmrollProps {
  frames: FrameData[];
  onSelectFrame: (frame: FrameData) => void;
}

const Filmroll: React.FC<FilmrollProps> = ({ frames, onSelectFrame }) => {
  return (
    <div className="filmroll-container">
      {frames.map((frame) => (
        <img
          key={frame.id}
          src={frame.thumbnail}
          alt={`Frame at ${frame.timestamp}s`}
          onClick={() => onSelectFrame(frame)}
          className="filmroll-thumbnail"
        />
      ))}
    </div>
  );
};

export default Filmroll;