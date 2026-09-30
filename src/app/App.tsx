import { useState } from 'react';
import ClassicStudio from './ClassicStudio';
import Studio from './Studio';
import '../styles/versions.css';
import '../styles/hud.css';

export default function App() {
  const [roomEnabled, setRoomEnabled] = useState(false);
  const [roomVisited, setRoomVisited] = useState(false);

  return <div className="version-shell">
    <div className="version-toolbar">
      <span>{roomEnabled ? 'ROOM SIMULATION' : 'CLASSIC LIGHT'}</span>
      <label className="room-switch">
        <span>Room simulation</span>
        <input type="checkbox" role="switch" checked={roomEnabled} onChange={e => {
          setRoomEnabled(e.target.checked);
          if (e.target.checked) setRoomVisited(true);
        }} />
        <span className="switch-track" aria-hidden="true" />
      </label>
    </div>
    <div className="version-content" hidden={roomEnabled}>
      <ClassicStudio active={!roomEnabled} />
    </div>
    <div className="version-content" hidden={!roomEnabled}>
      {roomVisited && <Studio active={roomEnabled} />}
    </div>
  </div>;
}
