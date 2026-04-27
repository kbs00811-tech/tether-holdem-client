/**
 * useHaptic — 모바일 햅틱 피드백 (P1-1 2026-04-28)
 *
 * 브라우저 Vibration API 활용:
 *   - Android Chrome / Firefox: 동작 ✅
 *   - iOS Safari: 미지원 ❌ (Apple 정책 — silent no-op)
 *   - 데스크탑: 미지원 (silent no-op)
 *
 * 정책:
 *   - settingsStore.hapticEnabled = false 시 항상 no-op
 *   - user-gesture 후 호출 권장 (브라우저 정책)
 *   - 너무 자주 호출 금지 (200ms 쿨다운으로 스팸 방지)
 *
 * 패턴 정의:
 *   - tap: 단일 짧은 진동 (10ms) — 일반 액션
 *   - win: 빅윈 패턴 (100, 50, 100, 50, 200ms) — 승리 강조
 *   - badbeat: 부드러운 짧은 펄스 (50, 30, 50ms) — 배드빗 위로
 *   - allin: 강한 단일 (200ms) — 올인 긴장감
 */

import { useSettingsStore } from '../stores/settingsStore';

let lastVibrateAt = 0;
const COOLDOWN_MS = 200;

function canVibrate(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.vibrate !== 'function') return false;
  return true;
}

function vibrateRaw(pattern: number | number[]): void {
  if (!canVibrate()) return;
  // 쿨다운 — 빠른 연속 호출 방지
  const now = Date.now();
  if (now - lastVibrateAt < COOLDOWN_MS) return;
  lastVibrateAt = now;
  try {
    navigator.vibrate(pattern);
  } catch {
    // iOS 또는 미지원 브라우저: 조용히 무시
  }
}

export type HapticPattern = 'tap' | 'win' | 'badbeat' | 'allin';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  win: [100, 50, 100, 50, 200],
  badbeat: [50, 30, 50],
  allin: 200,
};

/** 햅틱 발화 — 사용자 설정 hapticEnabled 자동 체크 */
export function haptic(pattern: HapticPattern): void {
  try {
    const enabled = useSettingsStore.getState().hapticEnabled;
    if (!enabled) return;
    vibrateRaw(PATTERNS[pattern]);
  } catch {}
}

/** Hook 형태 (선호 시) */
export function useHaptic() {
  return haptic;
}
