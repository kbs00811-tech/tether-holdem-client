/**
 * useDealerVoice — Dealer voice (Web Speech API TTS)
 *
 * Spoken effect during deal/flop/turn/river/showdown moments.
 * No audio files — browser built-in TTS.
 *
 * Default voice: en-US (locale-detected fallback for other languages).
 */

let voicesCached: SpeechSynthesisVoice[] | null = null;
let preferredVoice: SpeechSynthesisVoice | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    const list = window.speechSynthesis.getVoices();
    if (list.length > 0) {
      voicesCached = list;
      resolve(list);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        voicesCached = window.speechSynthesis.getVoices();
        resolve(voicesCached);
      };
    }
  });
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (preferredVoice) return preferredVoice;
  const voices = voicesCached || [];
  // 남성 영어 음성 선호 (딜러 느낌)
  const preferred =
    voices.find(v => /en-US/.test(v.lang) && /male|Alex|Tom|Daniel|David/i.test(v.name)) ||
    voices.find(v => /en-US/.test(v.lang)) ||
    voices.find(v => /en/.test(v.lang)) ||
    voices[0];
  preferredVoice = preferred || null;
  return preferredVoice;
}

let lastSpokenAt = 0;
const MIN_INTERVAL = 600; // 600ms 최소 간격 (너무 자주 안 말하게)
let dealerEnabled = true;

export function setDealerEnabled(enabled: boolean): void {
  dealerEnabled = enabled;
  if (!enabled && typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isDealerEnabled(): boolean {
  return dealerEnabled;
}

/**
 * 딜러 음성 재생
 * @param text 말할 텍스트 (영어 권장)
 * @param options volume/pitch/rate
 */
export function speakDealer(text: string, options: {
  volume?: number; pitch?: number; rate?: number; priority?: boolean;
} = {}): void {
  if (!dealerEnabled) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const now = Date.now();
  if (!options.priority && now - lastSpokenAt < MIN_INTERVAL) return;

  // 우선순위면 기존 발언 취소
  if (options.priority) {
    window.speechSynthesis.cancel();
  }

  lastSpokenAt = now;

  try {
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.volume = options.volume ?? 0.7;
    utter.pitch = options.pitch ?? 0.9;  // 약간 낮은 (딜러 느낌)
    utter.rate = options.rate ?? 1.1;    // 조금 빠르게
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.warn('[DealerVoice] speak failed:', e);
  }
}

// ── 특정 이벤트 헬퍼 ──
export function speakNewHand(): void {
  speakDealer('New hand!', { priority: true });
}

export function speakFlop(): void {
  speakDealer('Flop!');
}

export function speakTurn(): void {
  speakDealer('Turn!');
}

export function speakRiver(): void {
  speakDealer('River!');
}

export function speakAllIn(nickname?: string): void {
  speakDealer(nickname ? `${nickname} is all in!` : 'All in!', { priority: true, rate: 1.2 });
}

export function speakWinner(nickname: string, hand?: string): void {
  const text = hand ? `Winner: ${nickname} with ${hand}` : `Winner: ${nickname}`;
  speakDealer(text, { priority: true });
}

// 부팅 시 음성 로드
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
}
