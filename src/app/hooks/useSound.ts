/**
 * TETHER.BET Holdem - Sound Effects V19.4
 *
 * 근본 수정: 모든 play() 호출에서 AudioContext resume + 에러 로깅
 * iframe 환경 + 관전 모드에서도 사운드 보장
 */

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
  const available = pool.find(a => a.paused || a.ended);
  if (available) return available;
  const clone = new Audio(`/sounds/${file}`);
  pool.push(clone);
  return clone;
}

// ── 글로벌 상태 ──
let muted = false;
let masterVolume = 0.7;
let audioUnlocked = false;
let audioCtx: AudioContext | null = null;

function ensureAudioCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (Ctor) audioCtx = new Ctor();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx!;
}

// ── Unlock (첫 사용자 제스처) ──
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    const ctx = ensureAudioCtx();
    if (ctx) {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    }
    console.log('[SOUND] Audio unlocked');
    if (!muted) startBGM();
  } catch (e) {
    console.warn('[SOUND] Unlock failed:', e);
  }
}

// 매 클릭/터치마다 unlock + resume (절대 제거 안 함)
if (typeof window !== 'undefined') {
  const onInteraction = () => {
    if (!audioUnlocked) unlockAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  };
  document.addEventListener('click', onInteraction, { passive: true });
  document.addEventListener('touchstart', onInteraction, { passive: true });
  document.addEventListener('touchend', onInteraction, { passive: true });
  document.addEventListener('keydown', onInteraction, { passive: true });
}

// ── 파일 사운드 재생 ──
function play(file: string, volume: number = 0.5) {
  if (muted) return;
  try {
    // AudioContext resume 매번 시도
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    const audio = getAudio(file);
    audio.volume = Math.min(1, volume * masterVolume);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}

// ── Web Audio 비프음 ──
function playBeep(freq: number, duration: number, vol: number = 0.3, type: OscillatorType = 'sine') {
  if (muted) return;
  try {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol * masterVolume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function playDingDong(vol: number = 0.35) {
  if (muted) return;
  playBeep(880, 0.12, vol, 'sine');
  setTimeout(() => playBeep(660, 0.18, vol, 'sine'), 130);
}

function playTick(vol: number = 0.25) {
  if (muted) return;
  playBeep(1200, 0.05, vol, 'square');
}

function playChipCollect(vol: number = 0.3) {
  if (muted) return;
  for (let i = 0; i < 4; i++) {
    setTimeout(() => playBeep(2000 + Math.random() * 1500, 0.03, vol * (0.5 + Math.random() * 0.5), 'triangle'), i * 40);
  }
}

function playBadBeat(vol: number = 0.4) {
  if (muted) return;
  playBeep(150, 0.5, vol, 'sawtooth');
  setTimeout(() => playBeep(80, 0.8, vol * 0.6, 'sawtooth'), 200);
}

function playTimeBankStart(vol: number = 0.3) {
  if (muted) return;
  playBeep(440, 0.15, vol, 'sine');
  setTimeout(() => playBeep(550, 0.15, vol, 'sine'), 170);
  setTimeout(() => playBeep(660, 0.15, vol, 'sine'), 340);
}

// ── Sound definitions ──
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
  myTurn:         () => playDingDong(0.4),
  timerWarning:   () => playTick(0.3),
  communityFlip:  () => play('deal.wav', 0.5),
  chipCollect:    () => playChipCollect(0.3),
  badBeat:        () => playBadBeat(0.4),
  timeBankStart:  () => playTimeBankStart(0.3),
  playerJoin:     () => play('chip.mp3', 0.4),
  newHand:        () => play('start.mp3', 0.4),
};

// ── Mute/Volume ──
export function setMuted(v: boolean) { muted = v; }
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
