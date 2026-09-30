import { useEffect, useMemo, useRef, useState } from 'react';
import { NaturalStage } from './components/NaturalStage';
import { WindowEditor } from './components/WindowEditor';
import { defaults, lightingPresets, palettes, templateArtwork, textArtwork, validateProject, type Artwork, type StudioSettings } from './glassModel';
import '../styles/simulator.css';
import '../styles/studio.css';

const storageKey = 'stained-glass-studio-v2';
function restore() {
  try { const saved = localStorage.getItem(storageKey); if (saved) return validateProject(JSON.parse(saved)); } catch { /* A bad or inaccessible draft must not prevent startup. */ }
  return { settings: { ...defaults }, artwork: templateArtwork('Gothic') };
}
export default function Studio({ active = true }: { active?: boolean }) {
  const [saved] = useState(restore);
  const [settings, setSettings] = useState(saved.settings), [artwork, setArtwork] = useState(saved.artwork);
  const [open, setOpen] = useState(false), [editor, setEditor] = useState(false);
  const [past, setPast] = useState<Artwork[]>([]), [future, setFuture] = useState<Artwork[]>([]);
  const [stats, setStats] = useState({ tiles: 0, fps: 0 }), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState('LOCAL DRAFT');
  const exportRef = useRef<(() => void) | null>(null), projectFile = useRef<HTMLInputElement>(null);
  const projectLoadId = useRef(0);
  const drag = useRef<{ x: number; y: number; azimuth: number; elevation: number } | null>(null);
  const renderedArt = useMemo(() => settings.mode === 'text' ? textArtwork(settings.text, settings.palette, settings.seed) : artwork, [settings.mode, settings.text, settings.palette, settings.seed, artwork]);
  useEffect(() => {
    const timer = setTimeout(() => { try { localStorage.setItem(storageKey, JSON.stringify({ version: 2, settings, artwork })); setSaveStatus('SAVED LOCALLY'); } catch { setSaveStatus('SAVE PROJECT TO KEEP'); } }, 500);
    return () => clearTimeout(timer);
  }, [settings, artwork]);
  const update = <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => setSettings(s => ({ ...s, [key]: value }));
  const snapshot = () => { setPast(p => [...p.slice(-49), artwork]); setFuture([]); };
  const undo = () => { if (!past.length) return; setFuture(f => [...f, artwork]); setArtwork(past[past.length - 1]); setPast(p => p.slice(0, -1)); };
  const redo = () => { if (!future.length) return; setPast(p => [...p, artwork]); setArtwork(future[future.length - 1]); setFuture(f => f.slice(0, -1)); };
  const openEditor = () => {
    if (settings.mode === 'text') { snapshot(); setArtwork(renderedArt); update('mode', 'art'); }
    setEditor(true); setOpen(false);
  };
  const slider = (key: keyof StudioSettings, label: string, min: number, max: number, step: number, suffix = '') => <label className="parameter" key={key}><span>{label}<output>{Number(settings[key]).toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}{suffix}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={Number(settings[key])} onChange={e => update(key, Number(e.target.value))} /></label>;
  function saveProject() {
    const blob = new Blob([JSON.stringify({ version: 2, settings, artwork }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'stained-glass-project.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function loadProject(file?: File) {
    if (!file) return;
    const request = ++projectLoadId.current;
    try { if (file.size > 2_000_000) throw new Error('Project is too large. Choose a file under 2 MB.'); const project = validateProject(JSON.parse(await file.text())); if (request !== projectLoadId.current) return; snapshot(); setSettings(project.settings); setArtwork(project.artwork); setMessage('Project loaded.'); }
    catch (e) { if (request === projectLoadId.current) setMessage(e instanceof Error ? e.message : 'Could not load the project.'); }
  }
  return <main className="glass-app studio-app">
    {active && <NaturalStage settings={settings} artwork={renderedArt} onStats={setStats} onError={setError} exportRef={exportRef} />}
    <header className="stage-header"><h1>STAINED GLASS <span>STUDIO</span></h1><span className="edition">A STUDY IN COLORED LIGHT</span></header>
    <nav className="mode-switch" aria-label="Creation mode">{(['text', 'window', 'art'] as const).map(mode => <button key={mode} aria-pressed={settings.mode === mode} onClick={() => { update('mode', mode); if (mode === 'text') setEditor(false); }}>{mode === 'art' ? 'PIXEL ART' : mode.toUpperCase()}</button>)}</nav>
    <aside className={`controls ${open ? 'is-open' : ''}`}>
      <button className="controls-toggle" aria-expanded={open} aria-controls="room-light-controls" onClick={() => { setOpen(!open); if (!open) setEditor(false); }}>LIGHT & SCENE <span>{open ? '−' : '+'}</span></button>
      {open && <div id="room-light-controls" className="controls-body">
        <label className="text-label" htmlFor="lighting-preset">Lighting mood</label><select id="lighting-preset" defaultValue="" onChange={e => { const preset = lightingPresets[e.target.value]; setSettings(s => ({ ...s, ...preset })); e.target.value = ''; }}><option value="" disabled>Choose a lighting preset</option>{Object.keys(lightingPresets).map(p => <option key={p}>{p}</option>)}</select>
        <details open><summary>01 / SUNLIGHT</summary>
          {slider('azimuth', 'Sun direction', -65, 65, 1, '°')}{slider('elevation', 'Sun elevation', 12, 75, 1, '°')}{slider('intensity', 'Sunlight strength', 0, 12, 0.1)}{slider('warmth', 'Sun warmth', 0, 1, 0.01)}{slider('sunSize', 'Sun angular diameter', 0, 5, 0.01, '°')}
          <p className="control-note">A smaller sun gives sharper projections. Low sun casts longer pools of color.</p>
        </details>
        <details open><summary>02 / AIR & GLASS</summary>{slider('haze', 'Haze density', 0, 0.5, 0.01)}{slider('anisotropy', 'Forward scattering', -0.3, 0.8, 0.01)}{slider('thickness', 'Glass thickness', 0.1, 2.5, 0.05)}{slider('roughness', 'Handmade glass texture', 0, 1, 0.01)}{slider('lead', 'Lead seam width', 0, 0.3, 0.01)}
          <p className="control-note">At zero haze, sunlight is visible on the floor but not suspended in the air.</p>
        </details>
        <details><summary>03 / ROOM & LENS</summary>{slider('ambient', 'Room ambient light', 0, 0.5, 0.01)}{slider('floor', 'Stone reflectance', 0, 1, 0.01)}{slider('exposure', 'Camera exposure', 0.3, 3, 0.05)}{slider('bloom', 'Lens bloom', 0, 1.5, 0.05)}{slider('cameraYaw', 'View around window', -45, 45, 1, '°')}{slider('cameraHeight', 'Camera height', 0, 5, 0.1)}{slider('zoom', 'Camera zoom', 0.65, 1.6, 0.05)}<button className="secondary" onClick={() => setSettings(s => ({ ...s, cameraYaw: defaults.cameraYaw, cameraHeight: defaults.cameraHeight, zoom: 1 }))}>RESET CAMERA</button></details>
        <details><summary>04 / COMPOSITION</summary>{slider('size', 'Window scale', 0.4, 1.4, 0.05)}<label className="text-label" htmlFor="palette">Paint palette</label><select id="palette" value={settings.palette} onChange={e => update('palette', e.target.value)}>{Object.keys(palettes).map(p => <option key={p}>{p}</option>)}</select><div className="swatches">{palettes[settings.palette].map(c => <span key={c} style={{ background: c }} />)}</div>{settings.mode === 'text' ? <button className="secondary" onClick={() => update('seed', settings.seed + 1)}>RESHUFFLE TEXT COLORS</button> : <button className="secondary" onClick={() => { snapshot(); const colors = palettes[settings.palette]; setArtwork(a => ({ ...a, cells: a.cells.map((c, i) => c ? colors[(i + Math.floor(i / a.width)) % colors.length] : null) })); }}>APPLY PALETTE TO ART</button>}</details>
        <details><summary>05 / MOTION & QUALITY</summary><label className="motion-toggle"><span>Sun drift</span><input type="checkbox" checked={settings.animate} onChange={e => update('animate', e.target.checked)} /></label>{slider('speed', 'Time speed', 0.1, 2, 0.1)}<label className="text-label quality-label" htmlFor="quality">Render quality</label><select id="quality" value={settings.quality} onChange={e => update('quality', e.target.value as StudioSettings['quality'])}><option value="high">High · 72 volume samples</option><option value="draft">Fast · 32 volume samples</option></select></details>
        <div className="actions"><button onClick={() => setSettings(s => ({ ...defaults, mode: s.mode, text: s.text, palette: s.palette }))}>RESET LIGHT</button><button disabled={!!error} onClick={() => exportRef.current?.()}>SAVE PNG ↗</button></div>
        <div className="actions"><button onClick={saveProject}>SAVE PROJECT</button><button onClick={() => projectFile.current?.click()}>OPEN PROJECT</button></div>
      </div>}
    </aside>
    <input ref={projectFile} type="file" accept=".json,application/json" hidden onChange={e => { void loadProject(e.target.files?.[0]); e.target.value = ''; }} />
    {editor && <WindowEditor artwork={artwork} palette={settings.palette} onChange={setArtwork} onSnapshot={snapshot} onUndo={undo} onRedo={redo} canUndo={past.length > 0} canRedo={future.length > 0} onClose={() => setEditor(false)} />}
    <div className="scene-caption"><span>{settings.mode === 'text' ? 'TYPE IN LIGHT' : settings.mode === 'window' ? 'THE QUIET CHAPEL' : 'YOUR ART, IN LIGHT'}</span><p>{settings.elevation}° sunlight / {settings.haze === 0 ? 'clear air' : 'suspended haze'}</p></div>
    {error && <div role="alert" className="stage-error">{error}</div>}
    {message && <button className="studio-toast" role="status" onClick={() => setMessage('')}>{message} <span>×</span></button>}
    <div className="creation-dock">
      {settings.mode === 'text' ? <input aria-label="Text to render in stained glass" maxLength={32} value={settings.text} onChange={e => update('text', e.target.value)} placeholder="TYPE SOMETHING" spellCheck={false} /> : <label className="template-picker"><span>WINDOW</span><select aria-label="Window template" defaultValue="" onChange={e => { snapshot(); setArtwork(templateArtwork(e.target.value, settings.palette)); e.target.value = ''; }}><option value="" disabled>Choose a template</option>{['Gothic', 'Rose', 'Diamond', 'Pixel heart', 'Mosaic'].map(t => <option key={t}>{t}</option>)}</select></label>}
      <button className="create-button" onClick={openEditor}>{settings.mode === 'text' ? 'EDIT AS PIXELS' : 'OPEN WORKSHOP'} <span>↗</span></button>
    </div>
    <footer className="studio-footer"><span>{stats.tiles} GLASS PANES <i>/</i> {saveStatus}</span><span className="drag-hint">DRAG TO MOVE THE SUN</span><span>{settings.animate ? `${stats.fps} FPS` : 'LIVE PREVIEW'}</span></footer>
    <div className="drag-surface" aria-hidden="true" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, azimuth: settings.azimuth, elevation: settings.elevation }; }} onPointerMove={e => { if (!drag.current || !e.currentTarget.hasPointerCapture(e.pointerId)) return; const d = drag.current; setSettings(s => ({ ...s, azimuth: Math.round(Math.max(-65, Math.min(65, d.azimuth + (e.clientX - d.x) * 0.15))), elevation: Math.round(Math.max(12, Math.min(75, d.elevation - (e.clientY - d.y) * 0.1))) })); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} />
  </main>;
}
