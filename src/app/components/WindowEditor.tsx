import { useEffect, useRef, useState } from 'react';
import { blankArtwork, palettes, templateArtwork, type Artwork } from '../glassModel';

export function WindowEditor({ artwork, palette, onChange, onSnapshot, onUndo, onRedo, canUndo, canRedo, onClose }: {
  artwork: Artwork; palette: string; onChange: (a: Artwork) => void; onSnapshot: () => void;
  onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean; onClose: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null), file = useRef<HTMLInputElement>(null);
  const live = useRef(artwork); live.current = artwork;
  const drawing = useRef(false), lastCell = useRef<[number, number] | null>(null);
  const [tool, setTool] = useState('brush'), [color, setColor] = useState(palettes[palette][0]);
  const [mirror, setMirror] = useState(false), [brush, setBrush] = useState(1), [message, setMessage] = useState('');
  const [cursor, setCursor] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    const ctx = canvas.current!.getContext('2d')!;
    const unit = 12; canvas.current!.width = artwork.width * unit; canvas.current!.height = artwork.height * unit;
    for (let y = 0; y < artwork.height; y++) for (let x = 0; x < artwork.width; x++) {
      ctx.fillStyle = artwork.cells[y * artwork.width + x] || ((x + y) % 2 ? '#191c23' : '#101319');
      ctx.fillRect(x * unit, y * unit, unit, unit);
      ctx.strokeStyle = '#0006'; ctx.strokeRect(x * unit + 0.5, y * unit + 0.5, unit - 1, unit - 1);
    }
  }, [artwork]);
  const replace = (next: Artwork) => { onSnapshot(); onChange(next); };
  function paint(x: number, y: number, from?: [number, number] | null) {
    const a = live.current, cells = [...a.cells];
    if (tool === 'picker') { const picked = cells[y * a.width + x]; if (picked) setColor(picked); return; }
    const ink = tool === 'eraser' ? null : color;
    const put = (px: number, py: number) => {
      if (px < 0 || py < 0 || px >= a.width || py >= a.height) return;
      cells[py * a.width + px] = ink;
      if (mirror) cells[py * a.width + a.width - 1 - px] = ink;
    };
    if (tool === 'fill') {
      const target = cells[y * a.width + x]; if (target === ink) return;
      const stack = [[x, y]], visited = new Set<number>();
      while (stack.length) {
        const [px, py] = stack.pop()!;
        if (px < 0 || py < 0 || px >= a.width || py >= a.height) continue;
        const i = py * a.width + px;
        if (visited.has(i) || a.cells[i] !== target) continue;
        visited.add(i); put(px, py); stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
      }
    } else {
      const start = from || [x, y], distance = Math.max(Math.abs(start[0] - x), Math.abs(start[1] - y), 1);
      for (let step = 0; step <= distance; step++) {
        const px = Math.round(start[0] + (x - start[0]) * step / distance), py = Math.round(start[1] + (y - start[1]) * step / distance);
        for (let by = 0; by < brush; by++) for (let bx = 0; bx < brush; bx++) put(px + bx, py + by);
      }
    }
    const next = { ...a, cells }; live.current = next; onChange(next);
  }
  function cellAt(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = e.currentTarget.getBoundingClientRect();
    return [Math.max(0, Math.min(artwork.width - 1, Math.floor((e.clientX - rect.left) / rect.width * artwork.width))), Math.max(0, Math.min(artwork.height - 1, Math.floor((e.clientY - rect.top) / rect.height * artwork.height)))];
  }
  async function importImage(selected?: File) {
    if (!selected) return;
    try {
      const image = await createImageBitmap(selected);
      const c = document.createElement('canvas'); c.width = artwork.width; c.height = artwork.height;
      const ctx = c.getContext('2d')!;
      const scale = Math.min(c.width / image.width, c.height / image.height);
      ctx.drawImage(image, (c.width - image.width * scale) / 2, (c.height - image.height * scale) / 2, image.width * scale, image.height * scale); image.close();
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      const cells = Array.from({ length: c.width * c.height }, (_, i) => data[i * 4 + 3] < 96 ? null : '#' + Array.from(data.slice(i * 4, i * 4 + 3)).map(n => n.toString(16).padStart(2, '0')).join(''));
      replace({ width: c.width, height: c.height, cells }); setMessage('Image fitted to the pixel grid. Transparent pixels block light.');
    } catch { setMessage('Could not read that image. Try a PNG, JPEG, or WebP file.'); }
  }
  function exportArt() {
    const c = document.createElement('canvas'); c.width = artwork.width; c.height = artwork.height; const ctx = c.getContext('2d')!;
    artwork.cells.forEach((hex, i) => { if (hex) { ctx.fillStyle = hex; ctx.fillRect(i % artwork.width, Math.floor(i / artwork.width), 1, 1); } });
    const a = document.createElement('a'); a.download = 'glass-pixel-art.png'; a.href = c.toDataURL(); a.click();
  }
  return <aside className="window-editor" aria-label="Window and pixel art editor">
    <div className="editor-heading"><div><h2>GLASS WORKSHOP</h2><p>Every pixel changes the light.</p></div><button aria-label="Close editor" onClick={onClose}>×</button></div>
    <div className="template-row">{['Gothic', 'Rose', 'Diamond', 'Pixel heart'].map(t => <button key={t} onClick={() => replace(templateArtwork(t, palette, Math.min(48, artwork.width)))}>{t}</button>)}</div>
    <div className="tool-row">{['brush', 'eraser', 'fill', 'picker'].map(t => <button key={t} aria-pressed={tool === t} onClick={() => setTool(t)}>{t}</button>)}</div>
    <div className="paint-options"><label>Paint <input type="color" aria-label="Brush color" value={color} onChange={e => setColor(e.target.value)} /></label><label>Brush <select aria-label="Brush size" value={brush} onChange={e => setBrush(+e.target.value)}>{[1, 2, 3].map(n => <option key={n} value={n}>{n} px</option>)}</select></label><label><input type="checkbox" checked={mirror} onChange={e => setMirror(e.target.checked)} /> Mirror</label></div>
    <div className="paint-swatches">{palettes[palette].map(c => <button key={c} title={c} aria-label={`Paint ${c}`} aria-pressed={color === c} style={{ background: c }} onClick={() => setColor(c)} />)}</div>
    <div className="pixel-canvas-wrap"><canvas ref={canvas} tabIndex={0} aria-label="Pixel canvas. Arrow keys move the cursor; Space paints a pixel." onKeyDown={e => {
      if (e.key.startsWith('Arrow')) { e.preventDefault(); setCursor(([x, y]) => [Math.max(0, Math.min(artwork.width - 1, x + (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0))), Math.max(0, Math.min(artwork.height - 1, y + (e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0)))]); }
      if (e.key === ' ') { e.preventDefault(); onSnapshot(); paint(...cursor); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? onRedo() : onUndo(); }
    }} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true; if (tool !== 'picker') onSnapshot(); const cell = cellAt(e); setCursor(cell); paint(...cell); lastCell.current = cell; }} onPointerMove={e => { if (!drawing.current || tool === 'fill') return; const cell = cellAt(e); setCursor(cell); paint(...cell, lastCell.current); lastCell.current = cell; }} onPointerUp={() => { drawing.current = false; lastCell.current = null; }} onPointerCancel={() => { drawing.current = false; }} /></div>
    <div className="canvas-status"><span>{artwork.width} × {artwork.height} pixels</span><span>Cursor {cursor[0] + 1}, {cursor[1] + 1}</span></div>
    <div className="tool-row"><button disabled={!canUndo} onClick={onUndo}>Undo</button><button disabled={!canRedo} onClick={onRedo}>Redo</button><button onClick={() => replace(blankArtwork(artwork.width, artwork.height))}>Clear</button><button onClick={exportArt}>Pixel PNG</button></div>
    <div className="paint-options"><label>Resolution <select aria-label="Grid resolution" value={artwork.width <= 16 ? 16 : artwork.width <= 24 ? 24 : artwork.width <= 32 ? 32 : 48} onChange={e => {
      const n = +e.target.value, h = Math.min(64, Math.round(n * artwork.height / artwork.width));
      const next = blankArtwork(n, h); next.cells = next.cells.map((_, i) => artwork.cells[Math.min(artwork.height - 1, Math.floor(Math.floor(i / n) / h * artwork.height)) * artwork.width + Math.min(artwork.width - 1, Math.floor(i % n / n * artwork.width))]); replace(next);
    }}>{[16, 24, 32, 48].map(n => <option value={n} key={n}>{n} columns</option>)}</select></label><button onClick={() => file.current?.click()}>Import image</button><input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => { void importImage(e.target.files?.[0]); e.target.value = ''; }} /></div>
    <p className="editor-note">Dark checkerboard cells are opaque. Paint white for clear glass. Edits appear in the room immediately.</p>
    {message && <p className="editor-note" role="status">{message}</p>}
  </aside>;
}
