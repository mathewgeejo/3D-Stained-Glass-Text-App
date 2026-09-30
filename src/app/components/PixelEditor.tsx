import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useAppContext, PALETTES } from '../store';
import { getTextGrid } from '../utils/font';
import * as Dialog from '@radix-ui/react-dialog';

export const PixelEditor: React.FC = () => {
  const { isEditorOpen, setIsEditorOpen, grid, setGrid, paletteName } = useAppContext();
  
  // Local state for editing
  const [localGrid, setLocalGrid] = useState(grid);
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'draw' | 'erase'>('draw');

  const palette = PALETTES[paletteName] || PALETTES['Classic Stained'];

  // Reset local grid when opening
  React.useEffect(() => {
    if (isEditorOpen) {
      setLocalGrid(JSON.parse(JSON.stringify(grid)));
    }
  }, [isEditorOpen, grid]);

  const handlePointerDown = (r: number, c: number) => {
    setIsDrawing(true);
    const cell = localGrid[r][c];
    const newMode = cell.active && cell.colorIndex === activeColorIndex ? 'erase' : 'draw';
    setDrawMode(newMode);
    
    updateCell(r, c, newMode);
  };

  const handlePointerEnter = (r: number, c: number) => {
    if (!isDrawing) return;
    updateCell(r, c, drawMode);
  };

  const updateCell = (r: number, c: number, mode: 'draw' | 'erase') => {
    setLocalGrid(prev => {
      const next = [...prev];
      next[r] = [...next[r]];
      if (mode === 'draw') {
        next[r][c] = { active: true, colorIndex: activeColorIndex };
      } else {
        next[r][c] = { active: false, colorIndex: 0 };
      }
      return next;
    });
  };

  const handleSave = () => {
    setGrid(localGrid);
    setIsEditorOpen(false);
  };

  const handleApplyPreset = (word: string) => {
    setLocalGrid(getTextGrid(word));
  };

  return (
    <Dialog.Root open={isEditorOpen} onOpenChange={setIsEditorOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1f] border border-white/10 rounded-2xl p-6 z-50 w-[90vw] max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
          
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-white">Voxel Editor</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex gap-6 flex-1 overflow-hidden">
            {/* Tools */}
            <div className="w-48 space-y-6 shrink-0">
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-3">Brush Color</h3>
                <div className="grid grid-cols-2 gap-2">
                  {palette.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveColorIndex(i)}
                      className={activeColorIndex === i ? 'w-full aspect-square rounded-lg border-2 border-white scale-110 transition-all' : 'w-full aspect-square rounded-lg border-2 border-transparent hover:scale-105 transition-all'}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white/70 mb-3">Quick Words</h3>
                <div className="space-y-2">
                  {['LIGHT', 'GLASS', 'NEON', 'ART'].map(word => (
                    <button
                      key={word}
                      onClick={() => handleApplyPreset(word)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium transition-colors"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid Container */}
            <div className="flex-1 overflow-auto bg-black/50 rounded-xl border border-white/5 p-4 flex items-center justify-center">
              <div 
                className="inline-block border border-white/10 select-none touch-none"
                onPointerUp={() => setIsDrawing(false)}
                onPointerLeave={() => setIsDrawing(false)}
              >
                {localGrid.map((row, r) => (
                  <div key={r} className="flex">
                    {row.map((cell, c) => (
                      <div
                        key={c}
                        onPointerDown={() => handlePointerDown(r, c)}
                        onPointerEnter={() => handlePointerEnter(r, c)}
                        className="w-6 h-6 border-[0.5px] border-white/5 cursor-crosshair transition-colors duration-75"
                        style={{
                          backgroundColor: cell.active ? palette[cell.colorIndex % palette.length] : 'transparent'
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                Cancel
              </button>
            </Dialog.Close>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              Apply Changes
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
