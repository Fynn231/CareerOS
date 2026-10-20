'use client';
import { useState } from 'react';
import { classRules, type Encounter } from './model';
import s from './QuestDeck.module.css';

export function FitDossier({ job }: { job: Encounter }) {
  const [tab, setTab] = useState<'fit' | 'mission'>('fit');
  return <aside className={s.dossier} aria-label="Encounter dossier">
    <p className={s.eyebrow}>Read the terrain</p><h2>Field notes</h2>
    <div className={s.tabs} role="group" aria-label="Dossier content">
      <button aria-pressed={tab === 'fit'} aria-controls="encounter-notes" onClick={() => setTab('fit')}>Fit dossier</button>
      <button aria-pressed={tab === 'mission'} aria-controls="encounter-notes" onClick={() => setTab('mission')}>Mission brief</button>
    </div>
    <div id="encounter-notes">{tab === 'fit' ? <>
      <h3>{job.category === 'Final bosses' ? 'Your foothold in this world' : 'Why this is your territory'}</h3>
      <ul>{job.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
      <h3>{job.category === 'Final bosses' ? 'Before the boss fight' : 'Your next level-up'}</h3>
      <ul>{job.gaps.map(gap => <li key={gap}>{gap}</li>)}</ul>
    </> : <><h3>The mission</h3><p>{job.mission}</p><h3>A useful first move</h3><p>Pick one preparation idea from the fit dossier. Create a small fictional example and explain what it demonstrates, including its limits.</p></>}</div>
    <div className={s.classification}><strong>{job.category} / authored class</strong><p>{classRules[job.category]}</p></div>
    <p className={s.legend}>Classes are authored demo categories, not automatic hiring assessments. No real openings, salary claims, or fit probabilities.</p>
  </aside>;
}
