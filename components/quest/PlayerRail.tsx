'use client';
import s from './QuestDeck.module.css';
import { useRef, useState } from 'react';
export function PlayerRail() {
  const [name, setName] = useState('Fynn');
  const [draft, setDraft] = useState(name);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const editButton = useRef<HTMLButtonElement>(null);
  return <aside className={s.player} aria-label="Player profile">
    <svg className={s.playerMark} viewBox="0 0 64 76" aria-hidden="true"><path d="M32 2 59 15v30L32 72 5 45V15Z" fill="#263e3b" stroke="#a9d9c0" /><path d="m32 12 17 22-17 28-17-28Z" fill="none" stroke="#a9d9c0" /><path d="M19 34h26M32 12v50" stroke="#789c86" /><circle cx="32" cy="34" r="7" fill="#caddb6" /></svg>
    <p className={s.eyebrow}>Your next chapter</p><div className={s.playerHeader}><h2>{name}</h2><button className={s.editButton} ref={editButton} onClick={() => {setDraft(name); setError(''); setEditing(true);}}>Edit player name</button></div><p>Information Science background<br />An explorer of systems & possibilities.</p>{editing && <form noValidate onSubmit={e => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean || clean.length > 32) { setError('Use 1–32 characters for your player name.'); return; }
    setName(clean); setEditing(false); editButton.current?.focus();
  }}><label htmlFor="player-name">Player name</label><input autoFocus id="player-name" value={draft} onChange={e => setDraft(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'name-error' : undefined} />{error && <p role="alert" id="name-error">{error}</p>}<button>Save name</button><button type="button" onClick={() => {setEditing(false); editButton.current?.focus();}}>Cancel</button></form>}
    <h3>Confirmed foundations</h3><ul className={s.credentials}>
      <li>AWS Certified Developer Associate<span>USER-CONFIRMED CREDENTIAL</span></li>
      <li>Security+<span>USER-CONFIRMED CREDENTIAL</span></li>
    </ul><p className={s.railNote}>Start with what you know. Build evidence for what comes next.</p><p>Credentials guide this story; they do not guarantee eligibility or a hiring outcome.</p>
  </aside>;
}
