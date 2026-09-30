import React, { useState } from 'react';
import { Settings2, Download, Palette, Type, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext, PALETTES } from '../store';
import * as Collapsible from '@radix-ui/react-collapsible';

export const HUD: React.FC = () => {
  const { 
    paletteName, setPaletteName,
    rayIntensity, setRayIntensity,
    rayAttenuation, setRayAttenuation,
    bloomIntensity, setBloomIntensity,
    setIsEditorOpen,
    setTriggerExport
  } = useAppContext();
  
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="absolute top-4 left-4 z-10 w-80">
      <Collapsible.Root open={isOpen} onOpenChange={setIsOpen} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl text-white">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2 font-medium">
            <Settings2 className="w-5 h-5 text-white/70" />
            Control Panel
          </div>
          <Collapsible.Trigger asChild>
            <button className="p-1 hover:bg-white/10 rounded-md transition-colors">
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </Collapsible.Trigger>
        </div>

        <Collapsible.Content className="p-4 space-y-6">
          {/* Ray Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <SlidersHorizontal className="w-4 h-4" />
              Ray Properties
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/50">
                <span>Intensity</span>
                <span>{rayIntensity.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="0.1" max="5.0" step="0.1" 
                value={rayIntensity} onChange={e => setRayIntensity(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/50">
                <span>Attenuation</span>
                <span>{rayAttenuation.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="0.1" max="3.0" step="0.1" 
                value={rayAttenuation} onChange={e => setRayAttenuation(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/50">
                <span>Bloom</span>
                <span>{bloomIntensity.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="0.0" max="3.0" step="0.1" 
                value={bloomIntensity} onChange={e => setBloomIntensity(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          {/* Palette */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <Palette className="w-4 h-4" />
              Color Palette
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(PALETTES).map(name => (
                <button
                  key={name}
                  onClick={() => setPaletteName(name)}
                  className={paletteName === name ? 'p-2 rounded-lg border border-indigo-500 bg-indigo-500/20 transition-all flex flex-col items-center gap-2' : 'p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all flex flex-col items-center gap-2'}
                >
                  <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{name}</span>
                  <div className="flex w-full h-2 rounded-full overflow-hidden">
                    {PALETTES[name].map((color, i) => (
                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex gap-2">
            <button 
              onClick={() => setIsEditorOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Type className="w-4 h-4" />
              Edit Text
            </button>
            <button 
              onClick={() => setTriggerExport(Date.now())}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
};
