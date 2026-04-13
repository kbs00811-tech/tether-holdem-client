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
// iOS Safari / Chrome autoplay policy: HTMLAudioElement는 첫 사용자 제스처 내에서
// 한 번 play() 호출되어야 이후 자유롭게 재생 가능. AudioContext.resume()도 함께.
let audioUnlocked = false;
const KNOWN_FILES = [
  'deal.wav', 'chip.mp3', 'check.mp3', 'call.mp3', 'fold.mp3', 'raise.mp3',
  'allin.mp3', 'win.mp3', 'showdown.mp3', 'start.mp3', 'click.mp3',
  'cardwin.mp3', 'chips_raise.mp3', 'spark.mp3', 'bonus.wav',
  'royalflush.mp3', 'fullhouse.mp3', 'flush.mp3', 'straight.mp3', 'bgm.mp3',
];

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    // 1) AudioContext resume
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    }
    // 2) 모든 사운드 파일 pre-warm — 무음으로 즉시 play → pause
    for (const file of KNOWN_FILES) {
      const audio = new Audio(`/sounds/${file}`);
      audio.volume = 0;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        // pool에 등록하여 이후 재사용
        let pool = audioPool.get(file);
        if (!pool) { pool = []; audioPool.set(file, pool); }
        pool.push(audio);
      }).catch(() => {});
    }
    console.log('[SOUND] Audio unlocked');
    // BGM 자동 시작 (사용자가 mute 안 했으면)
    if (!muted) startBGM();
  } catch (e) {
    console.warn('[SOUND] Unlock failed:', e);
  }
}

// Auto-unlock on first click/touch
if (typeof window !== 'undefined') {
  const unlock = () => {
    unlockAudio();
    document.removeEventListener('click', unlock);
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('click', unlock);
  document.addEventListener('touchstart', unlock);
  document.addEventListener('keydown', unlock);
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
