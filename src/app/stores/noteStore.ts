/**
 * Note Store — 다른 사용자 메모 (2026-04-28)
 *
 * GG포커 표준: 본인만 보는 사용자 메모 + 컬러 라벨
 *   - 5색 라벨 (none/red/orange/yellow/green/blue)
 *   - 자유 텍스트 메모
 *   - localStorage 영속 (서버 송신 X — privacy)
 *   - 봇은 메모 불가
 */

import { create } from 'zustand';

export type NoteColor = 'none' | 'red' | 'orange' | 'yellow' | 'green' | 'blue';

export const NOTE_COLORS: Record<NoteColor, { hex: string; label: string }> = {
  none:   { hex: 'transparent', label: '없음' },
  red:    { hex: '#EF4444', label: '⚠️ 위험 (어그로)' },
  orange: { hex: '#FB923C', label: '🔥 공격적' },
  yellow: { hex: '#FBBF24', label: '👀 주의 (블러퍼)' },
  green:  { hex: '#34D399', label: '🐟 호구' },
  blue:   { hex: '#60A5FA', label: '🦈 고수' },
};

export interface PlayerNote {
  playerId: string;
  text: string;
  color: NoteColor;
  updatedAt: number;
}

interface NoteStore {
  notes: Record<string, PlayerNote>; // playerId → note
  setNote: (playerId: string, text: string, color: NoteColor) => void;
  removeNote: (playerId: string) => void;
  getNote: (playerId: string) => PlayerNote | null;
}

const STORAGE_KEY = 'holdem-player-notes';

function loadNotes(): Record<string, PlayerNote> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveNotes(notes: Record<string, PlayerNote>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch {}
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: loadNotes(),
  setNote: (playerId, text, color) => set(s => {
    const next = { ...s.notes };
    if (!text.trim() && color === 'none') {
      delete next[playerId]; // 빈 메모 + 색상 없음 → 삭제
    } else {
      next[playerId] = { playerId, text: text.trim(), color, updatedAt: Date.now() };
    }
    saveNotes(next);
    return { notes: next };
  }),
  removeNote: (playerId) => set(s => {
    const next = { ...s.notes };
    delete next[playerId];
    saveNotes(next);
    return { notes: next };
  }),
  getNote: (playerId) => get().notes[playerId] ?? null,
}));
