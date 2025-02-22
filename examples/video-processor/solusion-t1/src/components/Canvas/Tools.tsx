import React from 'react';

interface ToolsProps {
  onSelectTool: (tool: 'brush' | 'eraser' | 'move') => void;
}

const Tools: React.FC<ToolsProps> = ({ onSelectTool }) => {
  return (
    <div className="tools-container">
      <button onClick={() => onSelectTool('brush')}>Pędzel</button>
      <button onClick={() => onSelectTool('eraser')}>Gumka</button>
      <button onClick={() => onSelectTool('move')}>Przesuń</button>
    </div>
  );
};

export default Tools;