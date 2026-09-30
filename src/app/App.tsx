import { useRef, useState } from 'react';
import { GlassStage, GlassSettings, palettes } from './components/GlassStage';
import '../styles/simulator.css';

const initial: GlassSettings = { text: 'TAKE TWO', angle: -27, length: 0.78, intensity: 1.7, spread: 0.24, haze: 1.5, bloom: 0.55, thickness: 0.8, size: 1, palette: 'Cathedral', seed: 3, animate: false };
export default function App() {
  const [settings, setSettings] = useState(initial);
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState({ tiles: 0, fps: 0 });
  const [error, setError] = useState('');
  const exportRef = useRef<(() => void) | null>(null);
  const update = <K extends keyof GlassSettings>(key: K, value: GlassSettings[K]) => setSettings(s => ({ ...s, [key]: value }));
  const slider = (key: keyof GlassSettings, label: string, min: number, max: number, step: number, unit = '') => <label className="parameter" key={key}>
    <span>{label}<output>{Number(settings[key]).toFixed(step < 1 ? 2 : 0)}{unit}</output></span>
    <input aria-label={label} type="range" min={min} max={max} step={step} value={Number(settings[key])} onChange={e => update(key, Number(e.target.value))} />
  </label>;
  return <main className="glass-app">
    <GlassStage settings={settings} onStats={setStats} onError={setError} exportRef={exportRef} />
    <header className="stage-header"><h1>STAINED GLASS TYPE</h1><span className="edition">LIGHT / MATTER / TYPE</span></header>
    <aside className={`controls ${open ? 'is-open' : ''}`}>
      <button className="controls-toggle" aria-expanded={open} aria-controls="light-controls" onClick={() => setOpen(!open)}>CONTROLS <span>{open ? '-' : '+'}</span></button>
      {open && <div id="light-controls" className="controls-body">
        <section><h2>01 / TYPE</h2><label className="text-label" htmlFor="panel-text">Your words</label><input id="panel-text" className="panel-text" value={settings.text} maxLength={32} onChange={e => update('text', e.target.value)} placeholder="TYPE SOMETHING" />{slider('size', 'Type scale', 0.4, 1.6, 0.05)}</section>
        <section><h2>02 / LIGHT</h2>
          {slider('angle', 'Direction', -80, 80, 1, '°')}
          {slider('length', 'Beam length', 0, 1.4, 0.01)}
          {slider('intensity', 'Light intensity', 0, 4, 0.05)}
          {slider('spread', 'Source divergence', 0, 0.8, 0.01)}
          {slider('haze', 'Atmosphere density', 0, 4, 0.05)}
          {slider('bloom', 'Lens bloom', 0, 1.5, 0.05)}
        </section>
        <section><h2>03 / GLASS</h2><label className="text-label" htmlFor="palette">Color palette</label><select id="palette" value={settings.palette} onChange={e => update('palette', e.target.value)}>{Object.keys(palettes).map(p => <option key={p}>{p}</option>)}</select>
          <div className="swatches">{palettes[settings.palette].map(c => <span key={c} style={{ background: c }} />)}</div>
          {slider('thickness', 'Optical thickness', 0.2, 2, 0.05)}
          <button className="secondary" onClick={() => update('seed', settings.seed + 1)}>RESHUFFLE GLASS ?</button>
        </section>
        <label className="motion-toggle"><span>Slow light movement</span><input type="checkbox" checked={settings.animate} onChange={e => update('animate', e.target.checked)} /></label>
        <div className="actions"><button onClick={() => setSettings({ ...initial })}>RESET</button><button disabled={!!error} onClick={() => exportRef.current?.()}>SAVE PNG ?</button></div>
        <p className="control-note">Drag the stage to direct the light.</p>
      </div>}
    </aside>
    {error && <div role="alert" className="stage-error">{error}</div>}
    <footer className="stage-footer"><span>VOXELS · {stats.tiles}</span><label className="stage-input"><span className="sr-only">Text to render in stained glass</span><input aria-label="Text to render in stained glass" maxLength={32} value={settings.text} onChange={e => update('text', e.target.value)} placeholder="TYPE SOMETHING" spellCheck={false} autoComplete="off" /></label><span className="performance">FPS · {stats.fps}<br />CHARS · {Array.from(settings.text).length}</span></footer>
    <div className="drag-surface" aria-hidden="true" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) update('angle', Math.round((e.clientX / window.innerWidth - 0.5) * 150)); }} />
  </main>;
}


