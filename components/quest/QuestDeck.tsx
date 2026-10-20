'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { isInteractive } from './interaction';
import { PlayerRail } from './PlayerRail';
import { FitDossier } from './FitDossier';
import { EncounterCard } from './EncounterCard';
import { encounters } from './fixtures';
import { filters, initialDeck, reduceDeck, visibleEncounters, type DeckAction, type Encounter } from './model';
import s from './QuestDeck.module.css';

export function QuestDeck({ jobs = encounters }: { jobs?: Encounter[] }) {
  const [state, setState] = useState(initialDeck);
  const [roster, setRoster] = useState(false);
  const [feedback, setFeedback] = useState('');
  const deckFocus = useRef<HTMLDivElement>(null);
  const visible = visibleEncounters(jobs, state.filter);
  const job = visible[state.index];
  const dispatch = (action: DeckAction) => setState(current => reduceDeck(current, action, jobs));
  const move = (delta: number) => {dispatch({type: 'move', delta}); setFeedback('');};
  const browse = () => { setRoster(false); setFeedback(''); requestAnimationFrame(() => deckFocus.current?.focus()); };
  return <main className={s.desk} onKeyDown={e => {
    if (roster || isInteractive(e.target) || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1);
    }
  }}>
    <header className={s.header}>
      <div className={s.brand}><svg viewBox="0 0 40 48" aria-hidden="true"><path d="m20 2 17 10v23L20 46 3 35V12Z" fill="none" stroke="#acd9be" /><path d="m20 9 5 12 10 3-10 4-5 12-5-12-10-4 10-3Z" fill="#acd9be" /></svg>Career<span>OS</span></div>
      <span className={s.session}>Session demo</span>
      <nav aria-label="CareerOS navigation"><Link href="/prepare" prefetch={false}>Application prep ↗</Link><Link href="/tracker" prefetch={false}>Classic tracker ↗</Link><Link href="/workspace" prefetch={false}>Private workspace ↗</Link></nav>
    </header>
    <div className={s.intro}><div><p className={s.eyebrow}>The encounter desk / Chapter 01</p><h1>Explore your next chapter.</h1><p>Seven fictional possibilities. Find your territory, meet a stretch challenge, build your party.</p></div><button className={s.partyButton} aria-expanded={roster} onClick={() => {setRoster(!roster); setFeedback('');}}>Build your party ({state.saved.length})</button></div>
    <div className={s.layout}>
      <PlayerRail />
      <div className={s.center} ref={deckFocus} tabIndex={-1}>
        {roster ? <section className={s.roster} aria-label="Party roster">
          <p className={s.eyebrow}>Possibilities, collected</p><h2>Your party</h2>
          <p>Saved for this session. Recruiting a role never submits an application.</p>
          {state.saved.length === 0 ? <p>Your party is waiting for its first encounter.</p> : <ul>{jobs.filter(j => state.saved.includes(j.id)).map(j => <li key={j.id}><small>{j.category}</small><button aria-label={`View ${j.title}`} onClick={() => {dispatch({type: 'visit', id: j.id}); browse();}}>{j.title} <span aria-hidden="true">↗</span></button><small>{j.employer}</small></li>)}</ul>}
          <button className={s.quietButton} onClick={browse}>Browse encounters</button>
        </section> : <>
          <div className={s.filters} role="group" aria-label="Encounter category">{filters.map(filter => <button key={filter} aria-pressed={state.filter === filter} onClick={() => {dispatch({type: 'filter', filter}); setFeedback('');}}>{filter}</button>)}</div>
          {job ? <EncounterCard job={job} saved={state.saved.includes(job.id)} onToggle={() => {
            dispatch({type: 'toggle', id: job.id});
            setFeedback(state.saved.includes(job.id) ? `${job.title} removed from your party.` : `${job.title} recruited to your session party. No application sent.`);
          }} onMove={move} /> : <div className={s.empty}><h2>No encounters in this category.</h2><p>Try another category to continue exploring.</p><button className={s.quietButton} onClick={() => dispatch({type: 'filter', filter: 'All encounters'})}>Reset to all encounters</button></div>}
          <div className={s.deckNav}>
            <button aria-label="Previous job" disabled={state.index === 0 || !job} onClick={() => move(-1)}>← Previous</button>
            <p role="status" aria-live="polite" aria-atomic="true">Encounter {visible.length ? state.index + 1 : 0} / {visible.length}<span>{feedback || (job ? `${job.title} · Swipe or use ← →` : 'No fictional roles available')}</span></p>
            <button aria-label="Next job" disabled={state.index >= visible.length - 1 || !job} onClick={() => move(1)}>Next →</button>
          </div>
          {job && state.index === visible.length - 1 && <div className={s.endNote}>You’ve reached this path’s end.<button onClick={() => {dispatch({type: 'filter', filter: state.filter}); setFeedback('Back at the first encounter.');}}>Return to first encounter</button></div>}
        </>}
      </div>
      {job && !roster ? <FitDossier job={job} /> : <aside className={s.dossier}><p className={s.eyebrow}>A deliberate next step</p><h2>Keep your options open.</h2><p>Your party is a reading list of fictional roles. Open an encounter to revisit its mission, profile connections, and concrete preparation ideas.</p><p className={s.legend}>No applications, XP, hiring outcomes, or recruitment probabilities are recorded.</p></aside>}
    </div>
    <footer className={s.footer}><span>SESSION DEMO · Fictional jobs · Not saved after refresh.</span><span>Authored classes, not automatic hiring assessments. No application is submitted.</span></footer>
  </main>;
}
