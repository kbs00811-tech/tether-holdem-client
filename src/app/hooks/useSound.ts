/**
 * TETHER.BET Holdem - Sound Effects
 * Real poker sounds + Browser autoplay policy handling
 */

// ── Audio pool (prevents lag from creating new Audio each time) ──
const audioPool = new Map<string, HTMLAudioElement[]>();
const POOL_SIZE = 3;

function getAudio(file: string): HTMLAudioElement {
  let pool = audioPool.get(file);
  if (!pool) {
    pool = Array.from({ length: POOL_SIZE }, () => {
      const a = new Audio(`/sounds/${file}`);
      a.preload = 'auto';
      return a;
    });
    audioPool.set(file, pool);
  }
  // Find one that's not playing
  const available = pool.find(a => a.paused || a.ended);
  if (available) return available;
  // All busy — clone
  const clone = new Audio(`/sounds/${file}`);
  pool.push(clone);
  return clone;
}

// ── Unlock audio on first user interaction ──
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  // Play a silent buffer to unlock AudioContext
  try {
    const ctx = new AudioContext();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    audioUnlocked = true;
    console.log('[SOUND] Audio unlocked');
  } catch {}
}

// Auto-unlock on first click/touch
if (typeof window !== 'undefined') {
  const unlock = () => {
    unlockAudio();
    document.removeEventListener('click', unlock);
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('click', unlock, { once: true });
  document.addEventListener('touchstart', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });
}

// ── Play function ──
let masterVolume = 0.7; // 0-1

function play(file: string, volume: number = 0.5) {
  if (muted) return;
  try {
    const audio = getAudio(file);
    audio.volume = Math.min(1, volume * masterVolume);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}

// ── Sound definitions ──
export const sounds = {
  cardDeal:     () => play('deal.wav', 0.5),
  cardFlip:     () => play('deal.wav', 0.4),
  chipBet:      () => play('chip.mp3', 0.6),
  check:        () => play('check.mp3', 0.6),
  call:         () => play('call.mp3', 0.6),
  fold:         () => play('fold.mp3', 0.5),
  raise:        () => play('raise.mp3', 0.6),
  allIn:        () => play('allin.mp3', 0.8),
  win:          () => play('win.mp3', 0.7),
  showdown:     () => play('showdown.mp3', 0.6),
  start:        () => play('start.mp3', 0.5),
  click:        () => play('click.mp3', 0.4),
  cardWin:      () => play('cardwin.mp3', 0.6),
  chipsRaise:   () => play('chips_raise.mp3', 0.6),
  spark:        () => play('spark.mp3', 0.5),
  bonus:        () => play('bonus.wav', 0.6),
  royalFlush:   () => play('royalflush.mp3', 0.8),
  fullHouse:    () => play('fullhouse.mp3', 0.7),
  flush:        () => play('flush.mp3', 0.7),
  straight:     () => play('straight.mp3', 0.7),
  myTurn:       () => play('click.mp3', 0.6),
  timerWarning: () => play('click.mp3', 0.7),
  playerJoin:   () => play('chip.mp3', 0.4),
  newHand:      () => play('start.mp3', 0.4),
};

// ── Mute/Volume controls ──
let muted = false;
export function setMuted(v: boolean) { muted = v; console.log(`[SOUND] Muted: ${v}`); }
export function isMuted() { return muted; }
export function setMasterVolume(v: number) { masterVolume = Math.max(0, Math.min(1, v)); }
export function getMasterVolume() { return masterVolume; }
export function playSound(name: keyof typeof sounds) { if (!muted) sounds[name](); }

// ── BGM ──
let bgmAudio: HTMLAudioElement | null = null;
let bgmPlaying = false;

export function startBGM() {
  if (muted) return;
  try {
    if (!bgmAudio) {
      bgmAudio = new Audio('/sounds/bgm.mp3');
      bgmAudio.loop = true;
      bgmAudio.volume = 0.12 * masterVolume;
    }
    bgmAudio.play().then(() => { bgmPlaying = true; }).catch(() => {});
  } catch {}
}
export function stopBGM() {
  if (bgmAudio) { bgmAudio.pause(); bgmPlaying = false; }
}
export function isBGMPlaying() { return bgmPlaying; }
export function setBGMVolume(v: number) {
  if (bgmAudio) bgmAudio.volume = Math.min(0.3, v * masterVolume);
}
