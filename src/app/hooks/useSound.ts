/**
 * TETHER.BET Holdem - Sound V20 (극단적 단순화)
 *
 * 이전 문제: AudioContext, pool, unlock, pre-warm 등 복잡한 시스템 → 꼬여서 사운드 안 나옴
 * 해결: 그냥 new Audio().play(). 끝.
 */

let muted = false;        // 전체 뮤트
let bgmMuted = false;     // BGM만 뮤트
let sfxVolume = 0.7;      // V21.6: 효과음 볼륨 (독립)
let bgmVolume = 0.5;      // V21.6: BGM 볼륨 (독립)

/** 효과음 재생 — sfxVolume 사용 (bgmVolume과 독립) */
function play(file: string, vol: number = 0.5): void {
  if (muted) { return; }
  try {
    const a = new Audio(`/sounds/${file}`);
    a.volume = Math.min(1, vol * sfxVolume);
    a.play().then(() => {
      console.log(`[SND] ✅ OK: ${file}`);
    }).catch((e) => {
      console.error(`[SND] ❌ FAIL: ${file} — ${e?.name}: ${e?.message}`);
    });
  } catch (e) {
    console.error(`[SND] ❌ EXCEPTION: ${file}`, e);
  }
}

// ── Sound map ──
export const sounds = {
  cardDeal:       () => play('deal.wav', 0.5),
  cardFlip:       () => play('deal.wav', 0.4),
  chipBet:        () => play('chip.mp3', 0.6),
  check:          () => play('check.mp3', 0.6),
  call:           () => play('call.mp3', 0.6),
  fold:           () => play('fold.mp3', 0.5),
  raise:          () => play('raise.mp3', 0.6),
  allIn:          () => play('allin.mp3', 0.8),
  win:            () => play('win.mp3', 0.7),
  showdown:       () => play('showdown.mp3', 0.6),
  start:          () => play('start.mp3', 0.5),
  click:          () => play('click.mp3', 0.4),
  cardWin:        () => play('cardwin.mp3', 0.6),
  chipsRaise:     () => play('chips_raise.mp3', 0.6),
  spark:          () => play('spark.mp3', 0.5),
  bonus:          () => play('bonus.wav', 0.6),
  royalFlush:     () => play('royalflush.mp3', 0.8),
  fullHouse:      () => play('fullhouse.mp3', 0.7),
  flush:          () => play('flush.mp3', 0.7),
  straight:       () => play('straight.mp3', 0.7),
  myTurn:         () => play('click.mp3', 0.7),
  timerWarning:   () => play('click.mp3', 0.5),
  communityFlip:  () => play('deal.wav', 0.5),
  chipCollect:    () => play('chip.mp3', 0.4),
  badBeat:        () => play('showdown.mp3', 0.7),
  timeBankStart:  () => play('start.mp3', 0.5),
  playerJoin:     () => play('chip.mp3', 0.4),
  newHand:        () => play('start.mp3', 0.4),
};

export function playSound(name: keyof typeof sounds) { if (!muted) sounds[name](); }
// V21.5: 전체 뮤트 (효과음 + BGM 모두)
export function setMuted(v: boolean) { muted = v; if (v) { stopBGM(); stopLobbyBGM(); } }
export function isMuted() { return muted; }
// V21.6: BGM만 뮤트
export function setBGMMuted(v: boolean) { bgmMuted = v; if (v) { stopBGM(); stopLobbyBGM(); } }
export function isBGMMuted() { return bgmMuted; }
// V21.6: 효과음 볼륨 (독립)
export function setSFXVolume(v: number) { sfxVolume = Math.max(0, Math.min(1, v)); }
export function getSFXVolume() { return sfxVolume; }
// V21.6: BGM 볼륨 (독립)
export function setBGMVolumeLevel(v: number) {
  bgmVolume = Math.max(0, Math.min(1, v));
  if (bgmAudio) bgmAudio.volume = Math.min(0.3, bgmVolume * 0.4);
  if (lobbyAudio) (lobbyAudio as any).volume = Math.min(0.3, bgmVolume * 0.3);
}
export function getBGMVolumeLevel() { return bgmVolume; }
// 레거시 호환
export function setMasterVolume(v: number) { sfxVolume = Math.max(0, Math.min(1, v)); }
export function getMasterVolume() { return sfxVolume; }

// ── BGM (다중 장르 지원) ──
export const BGM_TRACKS = [
  { id: 'casino', name: '🎰 카지노 재즈', file: '/sounds/bgm_casino.mp3' },
  { id: 'tension', name: '😰 긴박감', file: '/sounds/bgm_tension.mp3' },
  { id: 'latin', name: '💃 라틴 재즈', file: '/sounds/bgm_latin.mp3' },
  { id: 'upbeat', name: '🎸 신나는 펑크', file: '/sounds/bgm_upbeat.mp3' },
  { id: 'hiphop', name: '🔥 멕시코 힙합', file: '/sounds/bgm_hiphop.mp3' },
  { id: 'groove', name: '🎵 펑키 그루브', file: '/sounds/bgm_groove.mp3' },
];

let bgmAudio: HTMLAudioElement | null = null;
let bgmPlaying = false;
let currentBGMId = 'upbeat';

export function getBGMTrackId() { return currentBGMId; }

export function setBGMTrack(trackId: string) {
  const track = BGM_TRACKS.find(t => t.id === trackId);
  if (!track) return;
  const wasPlaying = bgmPlaying;
  stopBGM();
  currentBGMId = trackId;
  bgmAudio = null; // 새 트랙으로 교체
  if (wasPlaying) startBGM();
}

export function startBGM() {
  if (muted || bgmMuted) return;
  try {
    if (!bgmAudio) {
      const track = BGM_TRACKS.find(t => t.id === currentBGMId) ?? BGM_TRACKS[0]!;
      bgmAudio = new Audio(track.file);
      bgmAudio.loop = true;
      bgmAudio.volume = Math.min(0.3, bgmVolume * 0.4);
    }
    bgmAudio.play().then(() => { bgmPlaying = true; }).catch(() => {});
  } catch {}
}
export function stopBGM() {
  if (bgmAudio) { bgmAudio.pause(); bgmPlaying = false; }
}
export function isBGMPlaying() { return bgmPlaying; }
export function setBGMVolume(v: number) {
  bgmVolume = v;
  if (bgmAudio) bgmAudio.volume = Math.min(0.3, v * 0.4);
}

// ── Lobby BGM (로비 전용, 게임 BGM과 독립) ──
// 로비는 조용한 분위기 — 게임 테이블(신나는 BGM_TRACKS)과 분리
export const LOBBY_BGM_TRACKS = [
  { id: 'lounge', name: '🍸 클래식 라운지', file: '/sounds/bgm.mp3' },
  { id: 'casino', name: '🎰 카지노 재즈', file: '/sounds/bgm_casino.mp3' },
  { id: 'latin', name: '💃 라틴 재즈', file: '/sounds/bgm_latin.mp3' },
];

let lobbyAudio: HTMLAudioElement | null = null;
let lobbyPlaying = false;
let lobbyBGMId = 'casino'; // 로비 기본: 카지노 재즈 (유저 요청 2026-04-24)

export function getLobbyBGMId() { return lobbyBGMId; }
export function setLobbyBGMTrack(trackId: string) {
  const track = LOBBY_BGM_TRACKS.find(t => t.id === trackId);
  if (!track) return;
  const wasPlaying = lobbyPlaying;
  stopLobbyBGM();
  lobbyBGMId = trackId;
  lobbyAudio = null;
  if (wasPlaying) startLobbyBGM();
}

export function startLobbyBGM() {
  if (muted || bgmMuted) return;
  try {
    if (!lobbyAudio) {
      const track = LOBBY_BGM_TRACKS.find(t => t.id === lobbyBGMId) ?? LOBBY_BGM_TRACKS[0]!;
      lobbyAudio = new Audio(track.file);
      lobbyAudio.loop = true;
      lobbyAudio.volume = Math.min(0.3, bgmVolume * 0.3);
    }
    lobbyAudio.play().then(() => { lobbyPlaying = true; console.log('[SND] 🎵 Lobby BGM started'); }).catch(() => {});
  } catch {}
}

export function stopLobbyBGM() {
  if (lobbyAudio) { lobbyAudio.pause(); lobbyPlaying = false; }
}

export function isLobbyBGMPlaying() { return lobbyPlaying; }

/** 사운드 뮤트 상태인지 (isMuted와 다른 이름) */
export function isSoundMuted() { return muted; }
