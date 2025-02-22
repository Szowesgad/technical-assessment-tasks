import { useState } from 'react';
import type { Mask } from '../types';

export const useCanvasEditor = () => {
  const [masks, setMasks] = useState<Mask[]>([]);
  
  const addMask = (mask: Mask) => {
    setMasks(prev => [...prev, mask]);
  };

  const updateMask = (maskId: string, updates: Partial<Mask>) => {
    setMasks(prev => prev.map(mask => mask.id === maskId ? { ...mask, ...updates } : mask));
  };

  const deleteMask = (maskId: string) => {
    setMasks(prev => prev.filter(mask => mask.id !== maskId));
  };

  return { masks, addMask, updateMask, deleteMask };
};