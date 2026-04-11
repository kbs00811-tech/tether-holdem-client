/**
 * TETHER.BET Holdem - Sound Effects (Real audio files)
 * Original poker sounds from PokerAces Unity client
 */

const audioCache = new Map<string, HTMLAudioElement>();

function play(file: string, volume: number = 0.5) {
  if (muted) return;
  try {
    let audio = audioCache.get(file);
    if (!audio) {
      audio = new Audio(`/sounds/${file}`);
      audioCache.set(file, audio);
    }
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}

export const sounds = {
  cardDeal:     () => play('deal.wav', 0.4),
  cardFlip:     () => play('deal.wav', 0.3),
  chipBet:      () => play('chip.mp3', 0.5),
  check:        () => play('check.mp3', 0.5),
  call:         () => play('call.mp3', 0.5),
  fold:         () => play('fold.mp3', 0.4),
  raise:        () => play('raise.mp3', 0.5),
  allIn:        () => play('allin.mp3', 0.6),
  win:          () => play('win.mp3', 0.6),
  showdown:     () => play('showdown.mp3', 0.5),
  start:        () => play('start.mp3', 0.4),
  click:        () => play('click.mp3', 0.3),
  cardWin:      () => play('cardwin.mp3', 0.5),
  chipsRaise:   () => play('chips_raise.mp3', 0.5),
  spark:        () => play('spark.mp3', 0.4),
  bonus:        () => play('bonus.wav', 0.5),
  royalFlush:   () => play('royalflush.mp3', 0.7),
  fullHouse:    () => play('fullhouse.mp3', 0.6),
  flush:        () => play('flush.mp3', 0.6),
  straight:     () => play('straight.mp3', 0.6),
  myTurn:       () => play('click.mp3', 0.5),
  timerWarning: () => play('click.mp3', 0.6),
  playerJoin:   () => play('chip.mp3', 0.3),
  newHand:      () => play('start.mp3', 0.3),
};

let muted = false;
export function setMuted(v: boolean) { muted = v; }
export function isMuted() { return muted; }
export function playSound(name: keyof typeof sounds) { if (!muted) sounds[name](); }
