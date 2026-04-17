/**
 * TETHER.BET Holdem - Sound V20 (극단적 단순화)
 *
 * 이전 문제: AudioContext, pool, unlock, pre-warm 등 복잡한 시스템 → 꼬여서 사운드 안 나옴
 * 해결: 그냥 new Audio().play(). 끝.
 */

let muted = false;
let masterVolume = 0.7;

/** 핵심 — 사운드 1개 재생. 이게 전부. */
function play(file: string, vol: number = 0.5): void {
  if (muted) return;
  try {
    const a = new Audio(`/sounds/${file}`);
    a.volume = Math.min(1, vol * masterVolume);
    a.play().catch(() => {});
  } catch {}
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
export function setMuted(v: boolean) { muted = v; if (v) stopBGM(); }
export function isMuted() { return muted; }
export function setMasterVolume(v: number) { masterVolume = Math.max(0, Math.min(1, v)); }
export function getMasterVolume() { return masterVolume; }

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
