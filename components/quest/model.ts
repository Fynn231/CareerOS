export type Category = 'Heroes' | 'Side quests' | 'Final bosses';
export type Filter = Category | 'All encounters';
export function nextIndex(index: number, delta: number, count: number) { return Math.max(0, Math.min(Math.max(0, count - 1), index + delta)); }
export interface Encounter {
  id: string; title: string; employer: string; category: Category; track: string;
  location: string; summary: string; reasons: string[]; gaps: string[]; mission: string;
}
export const filters: Filter[] = ['All encounters', 'Heroes', 'Side quests', 'Final bosses'];
export interface DeckState { filter: Filter; index: number; saved: string[] }
export const initialDeck: DeckState = { filter: 'All encounters', index: 0, saved: [] };
export type DeckAction = { type: 'move'; delta: number } | { type: 'filter'; filter: Filter } | { type: 'toggle'; id: string } | { type: 'visit'; id: string };
export function visibleEncounters(jobs: Encounter[], filter: Filter) {
  return jobs.filter(job => filter === 'All encounters' || job.category === filter);
}
export function reduceDeck(state: DeckState, action: DeckAction, jobs: Encounter[]): DeckState {
  if (action.type === 'filter') return { ...state, filter: action.filter, index: 0 };
  if (action.type === 'move') return { ...state, index: nextIndex(state.index, action.delta, visibleEncounters(jobs, state.filter).length) };
  if (action.type === 'toggle' && jobs.some(job => job.id === action.id)) return { ...state, saved: state.saved.includes(action.id) ? state.saved.filter(id => id !== action.id) : [...new Set([...state.saved, action.id])] };
  if (action.type === 'visit') {
    const index = jobs.findIndex(job => job.id === action.id);
    if (index >= 0) return { ...state, filter: 'All encounters', index };
  }
  return state;
}
export const classRules: Record<Category, string> = {
  Heroes: 'Closest thematic connection to your Information Science background or confirmed certifications. Experience still needs evidence.',
  'Side quests': 'Adjacent technology work: explore a new role while building on your information-systems background.',
  'Final bosses': 'Ambitious fictional mega-tech encounters with deeper engineering scope. Scale is the challenge; employers are not villains.',
};
