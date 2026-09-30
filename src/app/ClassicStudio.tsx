import { useRef, useState } from 'react';
import { GlassStage, GlassSettings, palettes } from './components/GlassStage';
import { WindowEditor } from './components/WindowEditor';
import { templateArtwork, textArtwork, palettes as artPalettes, type Artwork } from './glassModel';
import '../styles/simulator.css';

const initial: GlassSettings = { text: 'MATHEW', angle: -27, length: 0.78, intensity: 1.7, spread: 0.24, haze: 1.5, bloom: 0.55, thickness: 0.8, size: 1, palette: 'Cathedral', seed: 3, animate: false };
export default function ClassicStudio({ active = true }: { active?: boolean }) {
  const [settings, setSettings] = useState(initial);
  const [mode, setMode] = useState<'text' | 'window' | 'art'>('text');
  const [artwork, setArtwork] = useState(() => templateArtwork('Gothic'));
  const [editor, setEditor] = useState(false);
  const [past, setPast] = useState<Artwork[]>([]), [future, setFuture] = useState<Artwork[]>([]);
  const snapshot = () => { setPast(p => [...p.slice(-49), artwork]); setFuture([]); };
  const undo = () => { if (!past.length) return; setFuture(f => [...f, artwork]); setArtwork(past[past.length - 1]); setPast(p => p.slice(0, -1)); };
  const redo = () => { if (!future.length) return; setPast(p => [...p, artwork]); setArtwork(future[future.length - 1]); setFuture(f => f.slice(0, -1)); };
  const currentPalettes = mode === 'text' ? palettes : artPalettes;
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState({ tiles: 0, fps: 0 });
  const [error, setError] = useState('');
  const exportRef = useRef<(() => void) | null>(null);
  const update = <K extends keyof GlassSettings>(key: K, value: GlassSettings[K]) => setSettings(s => ({ ...s, [key]: value }));
  const openEditor = () => {
    if (mode === 'text') { snapshot(); setArtwork(textArtwork(settings.text, settings.palette, settings.seed, palettes[settings.palette])); setMode('art'); }
    setEditor(true); setOpen(false);
  };
  const slider = (key: keyof GlassSettings, label: string, min: number, max: number, step: number, unit = '') => <label className="parameter" key={key}>
    <span>{label}<output>{Number(settings[key]).toFixed(step < 1 ? 2 : 0)}{unit}</output></span>
    <input aria-label={label} type="range" min={min} max={max} step={step} value={Number(settings[key])} onChange={e => update(key, Number(e.target.value))} />
  </label>;
  return <main className="glass-app classic-app">
    {active && <GlassStage settings={settings} artwork={mode === 'text' ? undefined : artwork} onStats={setStats} onError={setError} exportRef={exportRef} />}
    <header className="stage-header"><h1>STAINED GLASS TYPE</h1><span className="edition">LIGHT / MATTER / TYPE</span></header>
    <nav className="mode-switch" aria-label="Creation mode">{(['text', 'window', 'art'] as const).map(next => <button key={next} aria-pressed={mode === next} onClick={() => { setMode(next); if (next === 'text') { setEditor(false); if (!palettes[settings.palette]) update('palette', 'Cathedral'); } }}>{next === 'art' ? 'PIXEL ART' : next.toUpperCase()}</button>)}</nav>
    <aside className={`controls ${open ? 'is-open' : ''}`}>
      <button className="controls-toggle" aria-expanded={open} aria-controls="light-controls" onClick={() => { setOpen(!open); if (!open) setEditor(false); }}>CONTROLS <span>{open ? '-' : '+'}</span></button>
      {open && <div id="light-controls" className="controls-body">
        <section><h2>01 / {mode === 'text' ? 'TYPE' : 'ARTWORK'}</h2>{mode === 'text' && <><label className="text-label" htmlFor="panel-text">Your words</label><input id="panel-text" className="panel-text" value={settings.text} maxLength={32} onChange={e => update('text', e.target.value)} placeholder="TYPE SOMETHING" /></>}{slider('size', mode === 'text' ? 'Type scale' : 'Artwork scale', 0.4, 1.6, 0.05)}</section>
        <section><h2>02 / LIGHT</h2>
          {slider('angle', 'Direction', -80, 80, 1, '°')}
          {slider('length', 'Beam length', 0, 1.4, 0.01)}
          {slider('intensity', 'Light intensity', 0, 4, 0.05)}
          {slider('spread', 'Source divergence', 0, 0.8, 0.01)}
          {slider('haze', 'Atmosphere density', 0, 4, 0.05)}
          {slider('bloom', 'Lens bloom', 0, 1.5, 0.05)}
        </section>
        <section><h2>03 / GLASS</h2><label className="text-label" htmlFor="classic-palette">Color palette</label><select id="classic-palette" value={settings.palette} onChange={e => update('palette', e.target.value)}>{Object.keys(currentPalettes).map(p => <option key={p}>{p}</option>)}</select>
          <div className="swatches">{currentPalettes[settings.palette].map(c => <span key={c} style={{ background: c }} />)}</div>
          {slider('thickness', 'Optical thickness', 0.2, 2, 0.05)}
          {mode === 'text' ? <button className="secondary" onClick={() => update('seed', settings.seed + 1)}>RESHUFFLE GLASS</button> : <button className="secondary" onClick={() => { snapshot(); const colors = artPalettes[settings.palette]; setArtwork(a => ({ ...a, cells: a.cells.map((c, i) => c ? colors[(i + Math.floor(i / a.width)) % colors.length] : null) })); }}>APPLY PALETTE TO ART</button>}
        </section>
        <label className="motion-toggle"><span>Slow light movement</span><input type="checkbox" checked={settings.animate} onChange={e => update('animate', e.target.checked)} /></label>
        <div className="actions"><button onClick={() => setSettings({ ...initial })}>RESET</button><button disabled={!!error} onClick={() => exportRef.current?.()}>SAVE PNG</button></div>
        <p className="control-note">Drag the stage to direct the light.</p>
      </div>}
    </aside>
    {editor && <WindowEditor artwork={artwork} palette={settings.palette} onChange={setArtwork} onSnapshot={snapshot} onUndo={undo} onRedo={redo} canUndo={past.length > 0} canRedo={future.length > 0} onClose={() => setEditor(false)} />}
    {error && <div role="alert" className="stage-error">{error}</div>}
    <div className="creation-dock">
      {mode === 'text' ? <input aria-label="Text to render in stained glass" maxLength={32} value={settings.text} onChange={e => update('text', e.target.value)} placeholder="TYPE SOMETHING" spellCheck={false} autoComplete="off" /> : <label className="template-picker"><span>WINDOW</span><select aria-label="Window template" defaultValue="" onChange={e => { snapshot(); setArtwork(templateArtwork(e.target.value, settings.palette)); e.target.value = ''; }}><option value="" disabled>Choose a template</option>{['Gothic', 'Rose', 'Diamond', 'Pixel heart', 'Mosaic'].map(t => <option key={t}>{t}</option>)}</select></label>}
      <button className="create-button" onClick={openEditor}>{mode === 'text' ? 'EDIT AS PIXELS' : 'OPEN WORKSHOP'} <span>↗</span></button>
    </div>
    <footer className="stage-footer"><span>GLASS PANES · {stats.tiles}</span><span className="performance">FPS · {stats.fps}{mode === 'text' && <><br />CHARS · {Array.from(settings.text).length}</>}</span></footer>
    <div className="drag-surface" aria-hidden="true" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) update('angle', Math.round((e.clientX / window.innerWidth - 0.5) * 150)); }} />
  </main>;
}
