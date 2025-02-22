import React, { useRef, useEffect, useState } from 'react';
import { FrameData } from '../../components/VideoProcessor';
interface Point {
  x: number;
  y: number;
}

interface Mask {
  id: string;
  points: Point[];
  color: string;
}

interface CanvasEditorProps {
  frame: FrameData;
  onMaskUpdate: (maskId: string, updates: Partial<Mask>) => void;
  onCreateMask: (points: Point[]) => void;
  onDeleteMask: (maskId: string) => void;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ frame, onMaskUpdate, onCreateMask, onDeleteMask }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [masks, setMasks] = useState<Mask[]>(() => frame.segmentation.masks.map(mask => ({
  id: 'id' in mask ? mask.id : `mask-${Date.now()}`,
  points: 'points' in mask ? mask.points : [],
  color: 'color' in mask ? mask.color : 'red'
})) as Mask[]);
  const [drawing, setDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [selectedMask, setSelectedMask] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Rysowanie obrazu klatki
    const img = new Image();
    img.src = frame.thumbnail;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Rysowanie masek segmentacji
      masks.forEach(mask => {
        ctx.beginPath();
        ctx.moveTo(mask.points[0].x, mask.points[0].y);
        mask.points.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.closePath();
        ctx.fillStyle = mask.color;
        ctx.globalAlpha = selectedMask === mask.id ? 0.8 : 0.5;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });
    };
  }, [frame, masks, selectedMask]);

  // Obsługa rozpoczęcia rysowania lub wyboru maski
  const handlePointerDown = (event: React.PointerEvent) => {
    const clickPoint = { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY };
    const clickedMask = masks.find(mask =>
      mask.points.some(point => Math.abs(point.x - clickPoint.x) < 10 && Math.abs(point.y - clickPoint.y) < 10)
    );
    
    if (clickedMask) {
      setSelectedMask(clickedMask.id);
      setDragging(true);
      setDragOffset({ x: clickPoint.x - clickedMask.points[0].x, y: clickPoint.y - clickedMask.points[0].y });
    } else {
      setDrawing(true);
      setCurrentPoints([clickPoint]);
      setSelectedMask(null);
    }
  };

  // Obsługa przesuwania maski lub dodawania punktów do rysowanej maski
  const handlePointerMove = (event: React.PointerEvent) => {
    if (dragging && selectedMask) {
      const movePoint = { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY };
      setMasks(masks.map(mask => mask.id === selectedMask ? {
        ...mask,
        points: mask.points.map(point => ({
          x: point.x + (movePoint.x - (mask.points[0].x + dragOffset!.x)),
          y: point.y + (movePoint.y - (mask.points[0].y + dragOffset!.y))
        }))
      } : mask));
    }

    if (drawing) {
      setCurrentPoints(prevPoints => [...prevPoints, { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY }]);
    }
  };

  // Zakończenie rysowania lub przesuwania maski
  const handlePointerUp = () => {
    if (drawing && currentPoints.length > 2) {
      const newMask: Mask = { id: `mask-${Date.now()}`, points: currentPoints, color: 'red' };
      setMasks(prevMasks => [...prevMasks, newMask]);
      onCreateMask(currentPoints);
    }
    setDrawing(false);
    setDragging(false);
    setCurrentPoints([]);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={frame.segmentation.masks[0]?.width || 720}
        height={frame.segmentation.masks[0]?.height || 360}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
};

export default CanvasEditor;