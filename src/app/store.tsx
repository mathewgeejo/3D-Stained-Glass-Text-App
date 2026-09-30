import React, { createContext, useContext, useState } from 'react';
import { getTextGrid } from './utils/font';

export type Palette = string[];

export const PALETTES: Record<string, Palette> = {
  'Classic Stained': ['#E63946', '#457B9D', '#F4A261', '#2A9D8F', '#9D4EDD'],
  'Cyberpunk': ['#FF007F', '#00FFFF', '#FFEA00', '#39FF14', '#FF00FF'],
  'Monochrome': ['#FFFFFF', '#D3D3D3', '#A9A9A9', '#808080', '#000000'],
  'Fire': ['#FFB703', '#FB8500', '#E01E37', '#9D0208', '#6A040F']
};

interface AppState {
  grid: { active: boolean, colorIndex: number }[][];
  setGrid: (grid: { active: boolean, colorIndex: number }[][]) => void;
  paletteName: string;
  setPaletteName: (name: string) => void;
  rayIntensity: number;
  setRayIntensity: (v: number) => void;
  rayAttenuation: number;
  setRayAttenuation: (v: number) => void;
  bloomIntensity: number;
  setBloomIntensity: (v: number) => void;
  isEditorOpen: boolean;
  setIsEditorOpen: (v: boolean) => void;
  triggerExport: number;
  setTriggerExport: (v: number) => void;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [grid, setGrid] = useState(() => getTextGrid('LIGHT'));
  const [paletteName, setPaletteName] = useState('Classic Stained');
  const [rayIntensity, setRayIntensity] = useState(1.5);
  const [rayAttenuation, setRayAttenuation] = useState(1.2);
  const [bloomIntensity, setBloomIntensity] = useState(1.5);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [triggerExport, setTriggerExport] = useState(0);

  return (
    <AppContext.Provider value={{
      grid, setGrid,
      paletteName, setPaletteName,
      rayIntensity, setRayIntensity,
      rayAttenuation, setRayAttenuation,
      bloomIntensity, setBloomIntensity,
      isEditorOpen, setIsEditorOpen,
      triggerExport, setTriggerExport
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
