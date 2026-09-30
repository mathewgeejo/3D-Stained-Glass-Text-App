import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Settings } from '../App';
import { PALETTES } from '../utils/constants';

interface ControlPanelProps {
  settings: Settings;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
  currentPalette: string[];
  setCurrentPalette: (palette: string[]) => void;
  exportPNG: (scale: number) => void;
  toggleEditor: () => void;
}

export default function ControlPanel({
  settings,
  setSettings,
  currentPalette,
  setCurrentPalette,
  exportPNG,
  toggleEditor,
}: ControlPanelProps) {
  const [rayControlsOpen, setRayControlsOpen] = useState(true);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const randomizeColors = () => {
    const newPalette = currentPalette.map(() => {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    });
    setCurrentPalette(newPalette);
  };

  const resetColors = () => {
    setCurrentPalette([...PALETTES.neon]);
    updateSetting('hueShift', 0);
    updateSetting('saturation', 1.0);
    updateSetting('brightness', 1.0);
  };

  const saveState = () => {
    const state = { settings, palette: currentPalette };
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stained-glass-state.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadState = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const state = JSON.parse(event.target?.result as string);
          setSettings(state.settings);
          setCurrentPalette(state.palette);
        } catch (err) {
          alert('Failed to load state: ' + (err as Error).message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="absolute top-4 right-4 bg-black/80 border border-white/30 px-3 py-3 text-xs uppercase tracking-wide max-w-[280px] max-h-[calc(100vh-32px)] overflow-y-auto">
      {/* TEXT */}
      <Section title="TEXT">
        <Label>Text Content</Label>
        <input
          type="text"
          value={settings.text}
          onChange={(e) => updateSetting('text', e.target.value || ' ')}
          maxLength={50}
          className="w-full bg-white/10 border border-white/20 text-white px-1.5 py-1 text-[10px] font-mono"
        />

        <Label>Font Size</Label>
        <select
          value={settings.fontSize}
          onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
          className="w-full bg-white/10 border border-white/20 text-white px-1.5 py-1 text-[10px] font-mono"
        >
          <option value="8">8px</option>
          <option value="16">16px</option>
          <option value="24">24px</option>
          <option value="32">32px</option>
        </select>

        <Label>Alignment</Label>
        <select
          value={settings.alignment}
          onChange={(e) => updateSetting('alignment', e.target.value as 'left' | 'center' | 'right')}
          className="w-full bg-white/10 border border-white/20 text-white px-1.5 py-1 text-[10px] font-mono"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>

        <Slider
          label="Letter Spacing"
          value={settings.letterSpacing}
          onChange={(v) => updateSetting('letterSpacing', v)}
          min={-2}
          max={4}
          step={1}
        />

        <Slider
          label="Line Height"
          value={settings.lineHeight}
          onChange={(v) => updateSetting('lineHeight', v)}
          min={1.0}
          max={2.5}
          step={0.1}
          decimals={1}
        />
      </Section>

      {/* RAY CONTROLS */}
      <Section
        title="RAY CONTROLS"
        collapsible
        open={rayControlsOpen}
        onToggle={() => setRayControlsOpen(!rayControlsOpen)}
      >
        <Slider
          label="Ray Length"
          value={settings.rayLength}
          onChange={(v) => updateSetting('rayLength', v)}
          min={0}
          max={2}
          step={0.05}
          decimals={2}
        />

        <Slider
          label="Ray Spread"
          value={settings.raySpread}
          onChange={(v) => updateSetting('raySpread', v)}
          min={0}
          max={60}
          step={1}
        />

        <Slider
          label="Ray Opacity"
          value={settings.rayOpacity}
          onChange={(v) => updateSetting('rayOpacity', v)}
          min={0}
          max={1}
          step={0.05}
          decimals={2}
        />

        <Slider
          label="Ray Blur"
          value={settings.rayBlur}
          onChange={(v) => updateSetting('rayBlur', v)}
          min={0}
          max={8}
          step={0.5}
          decimals={1}
        />

        <Slider
          label="Noise Intensity"
          value={settings.noiseIntensity}
          onChange={(v) => updateSetting('noiseIntensity', v)}
          min={0}
          max={1}
          step={0.05}
          decimals={2}
        />

        <Slider
          label="Noise Speed"
          value={settings.noiseSpeed}
          onChange={(v) => updateSetting('noiseSpeed', v)}
          min={0}
          max={2}
          step={0.1}
          decimals={1}
        />

        <Slider
          label="Tile Gap"
          value={settings.tileGap}
          onChange={(v) => updateSetting('tileGap', v)}
          min={0}
          max={4}
          step={0.5}
          decimals={1}
        />

        <Slider
          label="Tile Glow"
          value={settings.tileGlow}
          onChange={(v) => updateSetting('tileGlow', v)}
          min={0}
          max={16}
          step={1}
        />

        <label className="flex items-center gap-2 mt-2 text-[9px] text-gray-400">
          <input
            type="checkbox"
            checked={settings.animate}
            onChange={(e) => updateSetting('animate', e.target.checked)}
            className="w-3 h-3"
          />
          Animate
        </label>
      </Section>

      {/* COLORS */}
      <Section title="COLORS">
        <Label>Palette</Label>
        <select
          value={Object.entries(PALETTES).find(([_, pal]) => JSON.stringify(pal) === JSON.stringify(currentPalette))?.[0] || 'neon'}
          onChange={(e) => setCurrentPalette([...PALETTES[e.target.value as keyof typeof PALETTES]])}
          className="w-full bg-white/10 border border-white/20 text-white px-1.5 py-1 text-[10px] font-mono"
        >
          <option value="neon">Neon Cathedral</option>
          <option value="ember">Ember Church</option>
          <option value="arctic">Arctic Glass</option>
          <option value="forest">Forest Pane</option>
          <option value="mono">Monochrome</option>
        </select>

        <Slider
          label="Hue Shift"
          value={settings.hueShift}
          onChange={(v) => updateSetting('hueShift', v)}
          min={-180}
          max={180}
          step={5}
          suffix="°"
        />

        <Slider
          label="Saturation"
          value={settings.saturation}
          onChange={(v) => updateSetting('saturation', v)}
          min={0}
          max={2}
          step={0.1}
          decimals={1}
        />

        <Slider
          label="Brightness"
          value={settings.brightness}
          onChange={(v) => updateSetting('brightness', v)}
          min={0}
          max={2}
          step={0.1}
          decimals={1}
        />

        <Label>Background</Label>
        <input
          type="color"
          value={settings.bgColor}
          onChange={(e) => updateSetting('bgColor', e.target.value)}
          className="w-full h-6 border border-white/30 bg-transparent cursor-pointer"
        />

        <div className="flex gap-1 mt-2">
          <button
            onClick={randomizeColors}
            className="flex-1 bg-white/10 border border-white/30 text-white px-3 py-1.5 text-[9px] uppercase hover:bg-white/20 transition"
          >
            Randomize
          </button>
          <button
            onClick={resetColors}
            className="flex-1 bg-white/10 border border-white/30 text-white px-3 py-1.5 text-[9px] uppercase hover:bg-white/20 transition"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-6 gap-1 mt-2">
          {currentPalette.map((color, i) => (
            <div
              key={i}
              className="aspect-square border border-white/30 cursor-pointer hover:border-white transition"
              style={{ backgroundColor: color }}
              onClick={() => {
                const newColor = prompt('Enter hex color:', color);
                if (newColor) {
                  const newPalette = [...currentPalette];
                  newPalette[i] = newColor;
                  setCurrentPalette(newPalette);
                }
              }}
            />
          ))}
        </div>
      </Section>

      {/* EXPORT */}
      <Section title="EXPORT">
        <label className="flex items-center gap-2 mb-2 text-[9px] text-gray-400">
          <input
            type="checkbox"
            checked={settings.transparentBG}
            onChange={(e) => updateSetting('transparentBG', e.target.checked)}
            className="w-3 h-3"
          />
          Transparent BG
        </label>

        <div className="flex gap-1 mb-2">
          <button
            onClick={() => exportPNG(1)}
            className="flex-1 bg-white/10 border border-white/30 text-white px-2 py-1 text-[9px] uppercase hover:bg-white/20 transition"
          >
            PNG 1×
          </button>
          <button
            onClick={() => exportPNG(2)}
            className="flex-1 bg-white/10 border border-white/30 text-white px-2 py-1 text-[9px] uppercase hover:bg-white/20 transition"
          >
            PNG 2×
          </button>
          <button
            onClick={() => exportPNG(4)}
            className="flex-1 bg-white/10 border border-white/30 text-white px-2 py-1 text-[9px] uppercase hover:bg-white/20 transition"
          >
            PNG 4×
          </button>
        </div>

        <div className="flex gap-1 mb-2">
          <button
            onClick={saveState}
            className="flex-1 bg-white/10 border border-white/30 text-white px-3 py-1.5 text-[9px] uppercase hover:bg-white/20 transition"
          >
            Save JSON
          </button>
          <button
            onClick={loadState}
            className="flex-1 bg-white/10 border border-white/30 text-white px-3 py-1.5 text-[9px] uppercase hover:bg-white/20 transition"
          >
            Load JSON
          </button>
        </div>

        <button
          onClick={toggleEditor}
          className="w-full bg-white/10 border border-white/30 text-white px-3 py-1.5 text-[9px] uppercase hover:bg-white/20 transition"
        >
          Pixel Editor
        </button>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
  collapsible = false,
  open = true,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="mb-4 pb-3 border-b border-white/15 last:border-b-0">
      <div
        className={`text-[10px] text-gray-500 mb-2 flex justify-between items-center ${
          collapsible ? 'cursor-pointer hover:text-white' : ''
        }`}
        onClick={collapsible ? onToggle : undefined}
      >
        <span>{title}</span>
        {collapsible && (open ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block mt-1.5 mb-1 text-[9px] text-gray-400">{children}</label>;
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  decimals = 0,
  suffix = '',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  suffix?: string;
}) {
  return (
    <>
      <label className="block mt-1.5 mb-1 text-[9px] text-gray-400">
        {label} <span className="text-gray-600 float-right min-w-[40px] text-right">{value.toFixed(decimals)}{suffix}</span>
      </label>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-0.5 bg-white/20 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
      />
    </>
  );
}
