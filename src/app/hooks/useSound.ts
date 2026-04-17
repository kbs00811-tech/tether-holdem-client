/**
 * TETHER.BET Holdem - Sound V20 (극단적 단순화)
 *
 * 이전 문제: AudioContext, pool, unlock, pre-warm 등 복잡한 시스템 → 꼬여서 사운드 안 나옴
 * 해결: 그냥 new Audio().play(). 끝.
 */

let muted = false;
let masterVolume = 0.7;

/** 핵심 — 사운드 1개 재생 + 에러 상세 로그 */
function play(file: string, vol: number = 0.5): void {
  if (muted) { console.log(`[SND] MUTED skip: ${file}`); return; }
  console.log(`[SND] play: ${file} vol=${vol}`);
  try {
    const a = new Audio(`/sounds/${file}`);
    a.volume = Math.min(1, vol * masterVolume);
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
export function setMuted(v: boolean) { muted = v; if (v) stopBGM(); }
export function isMuted() { return muted; }
export function setMasterVolume(v: number) { masterVolume = Math.max(0, Math.min(1, v)); }
export function getMasterVolume() { return masterVolume; }

// ── BGM (다중 장르 지원) ──
export const BGM_TRACKS = [
  { id: 'lounge', name: '라운지 재즈', file: '/sounds/bgm.mp3' },
  // 아래는 파일 추가 시 활성화
  // { id: 'tension', name: '긴박감', file: '/sounds/bgm_tension.mp3' },
  // { id: 'chill', name: '편안한', file: '/sounds/bgm_chill.mp3' },
  // { id: 'kpop', name: 'K-Pop', file: '/sounds/bgm_kpop.mp3' },
  // { id: 'latin', name: '라틴', file: '/sounds/bgm_latin.mp3' },
  // { id: 'pop', name: '팝', file: '/sounds/bgm_pop.mp3' },
];

let bgmAudio: HTMLAudioElement | null = null;
let bgmPlaying = false;
let currentBGMId = 'lounge';

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
  if (muted) return;
  try {
    if (!bgmAudio) {
      const track = BGM_TRACKS.find(t => t.id === currentBGMId) ?? BGM_TRACKS[0]!;
      bgmAudio = new Audio(track.file);
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
