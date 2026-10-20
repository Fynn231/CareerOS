'use client';
import { useRef } from 'react';
import type { Encounter } from './model';
import { isInteractive, swipeDirection } from './interaction';
import { EncounterArt } from './EncounterArt';
import s from './QuestDeck.module.css';

export function EncounterCard({ job, saved, onToggle, onMove }: {
  job: Encounter; saved: boolean; onToggle: () => void; onMove: (delta: number) => void;
}) {
  const gesture = useRef<{ id: number; x: number; y: number; vertical: boolean } | null>(null);
  return <div className={s.cardStage}><article className={s.card} data-testid="quest-card" data-category={job.category} tabIndex={0} aria-label={`${job.title} encounter card. Use left and right arrows or swipe to browse.`}
    onPointerDown={e => {
      if (isInteractive(e.target) || e.button !== 0 || e.isPrimary === false) return;
      if (gesture.current) { gesture.current = null; return; }
      gesture.current = {id: e.pointerId, x: e.clientX, y: e.clientY, vertical: false};
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }}
    onPointerMove={e => {
      const g = gesture.current;
      if (!g || g.id !== e.pointerId) return;
      if (Math.abs(e.clientY - g.y) > 12 && Math.abs(e.clientY - g.y) >= Math.abs(e.clientX - g.x)) g.vertical = true;
    }}
    onPointerCancel={() => {gesture.current = null;}}
    onLostPointerCapture={() => {gesture.current = null;}}
    onPointerUp={e => {
      const g = gesture.current;
      gesture.current = null;
      if (!g || g.id !== e.pointerId || g.vertical || isInteractive(e.target)) return;
      const direction = swipeDirection(e.clientX - g.x, e.clientY - g.y);
      if (direction) onMove(direction);
    }}>
    <div key={job.id} className={s.cardInner}>
      <div className={s.cardTop}><span>{job.category === 'Heroes' ? '◇ Hero encounter' : job.category === 'Side quests' ? '⌖ Side quest' : '✦ Final boss'}</span><span>Fictional role</span></div>
      <div className={s.art}><EncounterArt category={job.category} /></div>
      <div className={s.cardCopy}>
        <p className={s.eyebrow}>{job.track}</p>
        <h2 data-testid="quest-role">{job.title}</h2>
        <p className={s.employer}>{job.employer}<br />{job.location}</p>
        <p>{job.summary}</p>
      </div>
      <div className={s.cardBottom}><button className={s.recruit} onClick={onToggle}>{saved ? 'Remove from party' : 'Recruit to party'} <span aria-hidden="true">{saved ? '−' : '+'}</span></button><small>Save a possibility.<br />No application sent.</small></div>
    </div>
  </article></div>;
}
