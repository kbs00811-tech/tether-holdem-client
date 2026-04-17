/**
 * SoundManager — 게임 사운드 통합 관리자 (V20)
 *
 * 모든 사운드 호출의 단일 진입점.
 * gameStore/GameTable에서 직접 playSound 안 하고 SoundManager 메서드만 호출.
 */

import { playSound } from '../hooks/useSound';

class _SoundManager {
  /** PLAYER_ACTION 수신 시 자동 사운드 매핑 */
  onAction(action: number): void {
    switch (action) {
      case 0: playSound('fold'); break;
      case 1: playSound('check'); break;
      case 2: playSound('call'); break;
      case 3: playSound('raise'); break;
      case 4: playSound('allIn'); break;
      default: break; // 알 수 없는 액션 — 무음
    }
  }

  /** 커뮤니티 카드 오픈 (FLOP/TURN/RIVER) */
  onCommunityCards(): void {
    playSound('communityFlip');
  }

  /** 핸드 결과 */
  onHandResult(): void {
    playSound('win');
    setTimeout(() => playSound('chipCollect'), 800);
  }

  /** 배드비트/쿨러 */
  onDramatic(type: 'bad_beat' | 'cooler'): void {
    playSound(type === 'bad_beat' ? 'badBeat' : 'showdown');
  }

  /** 내 턴 */
  onMyTurn(): void {
    playSound('myTurn');
  }

  /** 타이머 경고 (10초 이하) */
  onTimerWarning(): void {
    playSound('timerWarning');
  }

  /** 타임뱅크 시작 */
  onTimeBankStart(): void {
    playSound('timeBankStart');
  }

  /** 카드 딜링 */
  onDeal(): void {
    playSound('cardDeal');
  }

  /** 새 핸드 시작 */
  onNewHand(): void {
    playSound('newHand');
  }

  /** 클릭 */
  onClick(): void {
    playSound('click');
  }
}

export const SoundManager = new _SoundManager();
