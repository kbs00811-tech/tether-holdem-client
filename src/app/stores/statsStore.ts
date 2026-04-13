/**
 * TETHER.BET Holdem - Player Stats Store (Zustand + localStorage persist)
 *
 * 클라이언트 측에서 내 플레이 통계를 영구 저장한다.
 * 서버 DB 없이도 VPIP/PFR/AF/승률 계산 가능.
 *
 * 추적 방식:
 *  - HAND_RESULT 이벤트로 핸드 종료 감지
 *  - PLAYER_ACTION 중 내 액션만 집계
 *  - 핸드 시작 시 onHandStart() 호출하여 내 참가 기록
 *
 * 포커 통계 정의:
 *  - VPIP (Voluntarily Put $ In Pot) : 블라인드 외에 자발적 콜/레이즈한 핸드 비율
 *  - PFR  (Pre-Flop Raise)            : 프리플랍에서 레이즈한 핸드 비율
 *  - AF   (Aggression Factor)         : (Raise + Bet) / Call, >1이면 공격적
 *  - Winrate                          : 이긴 핸드 / 플레이한 핸드
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface HandRecord {
  handNumber: number;
  timestamp: number;
  tableName?: string;
  pot: number;           // 총 팟 (cents)
  myBet: number;         // 내가 낸 베팅 합계 (cents)
  myWin: number;         // 내가 이긴 금액 (0이면 패배/폴드)
  board: any[];
  won: boolean;
  result: 'win' | 'lose' | 'fold' | 'split';
  vpipHand: boolean;     // 이 핸드에서 voluntarily put $ in pot 했나
  pfrHand: boolean;      // 이 핸드에서 preflop raise 했나
  phase: string;         // 내가 끝까지 간 phase (PREFLOP, FLOP, TURN, RIVER, SHOWDOWN)
}

interface SessionState {
  handNumber: number;    // 현재 핸드 번호
  inHand: boolean;       // 현재 핸드에 참여 중
  myBet: number;         // 이번 핸드에 낸 총 베팅
  phase: string;         // 현재 phase
  voluntaryAction: boolean;  // 이 핸드에서 자발적 콜/레이즈 발생?
  preflopRaise: boolean;     // 이 핸드 프리플랍 레이즈 발생?
  aggressiveActions: number; // 이 핸드 공격적 액션 (bet/raise)
  passiveActions: number;    // 이 핸드 수동 액션 (call)
}

interface StatsStore {
  // ─── 영구 집계 통계 ───
  totalHands: number;
  handsWon: number;
  totalPot: number;      // 참여한 모든 팟 합계
  totalBet: number;      // 누적 베팅
  totalWin: number;      // 누적 승리 금액
  biggestWin: number;
  biggestLoss: number;
  currentStreak: number;    // 연승 (+) / 연패 (-)
  longestWinStreak: number;

  // VPIP/PFR/AF 원자 카운터
  vpipCount: number;     // 자발적으로 돈 낸 핸드 수
  pfrCount: number;      // 프리플랍 레이즈 핸드 수
  aggressiveActions: number;
  passiveActions: number;

  // ─── 핸드별 기록 (최근 200개만 유지) ───
  handRecords: HandRecord[];

  // ─── 현재 핸드 트랜지언트 상태 (persist 제외) ───
  currentSession: SessionState;

  // ─── 액션 ───
  onHandStart: (handNumber: number) => void;
  onMyAction: (action: number, amount: number, phase: string) => void;
  onPhaseChange: (phase: string) => void;
  onHandEnd: (record: {
    handNumber: number;
    tableName?: string;
    pot: number;
    myWin: number;
    won: boolean;
    board: any[];
    result: 'win' | 'lose' | 'fold' | 'split';
  }) => void;
  reset: () => void;
  // 파생 통계
  getVPIP: () => number;
  getPFR: () => number;
  getAF: () => number;
  getWinRate: () => number;
  getNetProfit: () => number;
}

// BettingAction 값 (serverTypes.ts 와 일치)
const ACTION = {
  FOLD: 0,
  CHECK: 1,
  CALL: 2,
  RAISE: 3,
  ALL_IN: 4,
};

const initialSession = (): SessionState => ({
  handNumber: 0,
  inHand: false,
  myBet: 0,
  phase: 'PREFLOP',
  voluntaryAction: false,
  preflopRaise: false,
  aggressiveActions: 0,
  passiveActions: 0,
});

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      totalHands: 0,
      handsWon: 0,
      totalPot: 0,
      totalBet: 0,
      totalWin: 0,
      biggestWin: 0,
      biggestLoss: 0,
      currentStreak: 0,
      longestWinStreak: 0,
      vpipCount: 0,
      pfrCount: 0,
      aggressiveActions: 0,
      passiveActions: 0,
      handRecords: [],
      currentSession: initialSession(),

      onHandStart: (handNumber) => {
        set({
          currentSession: {
            ...initialSession(),
            handNumber,
            inHand: true,
            phase: 'PREFLOP',
          },
        });
      },

      onMyAction: (action, amount, phase) => {
        set((s) => {
          const sess = { ...s.currentSession, phase };
          if (amount > 0) sess.myBet += amount;

          // 프리플랍에서 자발적으로 돈 넣으면 VPIP 카운트
          if (phase === 'PREFLOP') {
            if (action === ACTION.CALL || action === ACTION.RAISE || action === ACTION.ALL_IN) {
              sess.voluntaryAction = true;
            }
            if (action === ACTION.RAISE) {
              sess.preflopRaise = true;
            }
          }

          // 공격성 카운트 (모든 phase)
          if (action === ACTION.RAISE || action === ACTION.ALL_IN) {
            sess.aggressiveActions++;
          } else if (action === ACTION.CALL) {
            sess.passiveActions++;
          }

          return { currentSession: sess };
        });
      },

      onPhaseChange: (phase) => {
        set((s) => ({
          currentSession: { ...s.currentSession, phase },
        }));
      },

      onHandEnd: (result) => {
        set((s) => {
          const sess = s.currentSession;
          // ★ inHand 만 체크 — handNumber 매칭 제거 (서버/클라 ID 불일치 무시)
          // 이전: handNumber !== result.handNumber → 모든 핸드 skip
          if (!sess.inHand) {
            return {};
          }

          const profit = result.myWin - sess.myBet;
          const record: HandRecord = {
            handNumber: result.handNumber,
            timestamp: Date.now(),
            tableName: result.tableName,
            pot: result.pot,
            myBet: sess.myBet,
            myWin: result.myWin,
            board: result.board,
            won: result.won,
            result: result.result,
            vpipHand: sess.voluntaryAction,
            pfrHand: sess.preflopRaise,
            phase: sess.phase,
          };

          const newRecords = [...s.handRecords, record].slice(-200);
          const newStreak = result.won
            ? (s.currentStreak >= 0 ? s.currentStreak + 1 : 1)
            : (s.currentStreak <= 0 ? s.currentStreak - 1 : -1);

          return {
            totalHands: s.totalHands + 1,
            handsWon: result.won ? s.handsWon + 1 : s.handsWon,
            totalPot: s.totalPot + result.pot,
            totalBet: s.totalBet + sess.myBet,
            totalWin: s.totalWin + result.myWin,
            biggestWin: profit > 0 ? Math.max(s.biggestWin, profit) : s.biggestWin,
            biggestLoss: profit < 0 ? Math.max(s.biggestLoss, Math.abs(profit)) : s.biggestLoss,
            currentStreak: newStreak,
            longestWinStreak: Math.max(s.longestWinStreak, newStreak > 0 ? newStreak : 0),
            vpipCount: sess.voluntaryAction ? s.vpipCount + 1 : s.vpipCount,
            pfrCount: sess.preflopRaise ? s.pfrCount + 1 : s.pfrCount,
            aggressiveActions: s.aggressiveActions + sess.aggressiveActions,
            passiveActions: s.passiveActions + sess.passiveActions,
            handRecords: newRecords,
            currentSession: initialSession(),
          };
        });
      },

      reset: () => {
        set({
          totalHands: 0,
          handsWon: 0,
          totalPot: 0,
          totalBet: 0,
          totalWin: 0,
          biggestWin: 0,
          biggestLoss: 0,
          currentStreak: 0,
          longestWinStreak: 0,
          vpipCount: 0,
          pfrCount: 0,
          aggressiveActions: 0,
          passiveActions: 0,
          handRecords: [],
          currentSession: initialSession(),
        });
      },

      getVPIP: () => {
        const s = get();
        return s.totalHands > 0 ? Math.round((s.vpipCount / s.totalHands) * 1000) / 10 : 0;
      },
      getPFR: () => {
        const s = get();
        return s.totalHands > 0 ? Math.round((s.pfrCount / s.totalHands) * 1000) / 10 : 0;
      },
      getAF: () => {
        const s = get();
        return s.passiveActions > 0
          ? Math.round((s.aggressiveActions / s.passiveActions) * 10) / 10
          : s.aggressiveActions > 0 ? 99.9 : 0;
      },
      getWinRate: () => {
        const s = get();
        return s.totalHands > 0 ? Math.round((s.handsWon / s.totalHands) * 1000) / 10 : 0;
      },
      getNetProfit: () => {
        const s = get();
        return s.totalWin - s.totalBet;
      },
    }),
    {
      name: 'tetherbet-stats',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        totalHands: s.totalHands,
        handsWon: s.handsWon,
        totalPot: s.totalPot,
        totalBet: s.totalBet,
        totalWin: s.totalWin,
        biggestWin: s.biggestWin,
        biggestLoss: s.biggestLoss,
        currentStreak: s.currentStreak,
        longestWinStreak: s.longestWinStreak,
        vpipCount: s.vpipCount,
        pfrCount: s.pfrCount,
        aggressiveActions: s.aggressiveActions,
        passiveActions: s.passiveActions,
        handRecords: s.handRecords,
      }),
    }
  )
);
