/**
 * TETHER.BET Holdem - Game Store (Zustand)
 * 서버와 실시간 동기화되는 게임 상태 관리
 */

import { create } from 'zustand';
import type {
  ServerMessage, GameState, RoomInfo, Card,
  WinnerInfo,
} from '../types/serverTypes';
import { playSound } from '../hooks/useSound';
import { useStatsStore } from './statsStore';
import {
  speakNewHand, speakFlop, speakTurn, speakRiver, speakAllIn, speakWinner,
} from '../hooks/useDealerVoice';

// 내 playerId — gameStore.myPlayerId 직접 사용 (DEAL_CARDS에서 set됨)
// (이전: handCards로 추적했으나 서버 sanitize 후 작동 안 함)

interface TurnInfo {
  timeoutMs: number;
  deadline?: number;   // 서버 절대 시각 (Date.now() 기준). 네트워크 지연 보정에 사용
  serverTime?: number; // 서버가 보낸 시점 (오프셋 계산용)
  minBet: number;
  maxBet: number;
  callAmount: number;
  equity?: number;  // 0-100, 내 핸드 승률 (상대 레인지 대비)
}

interface LastAction {
  playerId: string;
  seat: number;
  action: number;   // 0=fold, 1=check, 2=call, 3=raise, 4=allin
  amount: number;
  timestamp: number;
}

interface GameStore {
  connected: boolean;
  rooms: RoomInfo[];
  currentRoomId: string | null;
  gameState: GameState | null;
  myCards: Card[];
  isMyTurn: boolean;
  turnInfo: TurnInfo | null;
  winners: WinnerInfo[] | null;
  emptySeats: number[];
  runItBoards: any[] | null;
  chatMessagesUnread: number;
  myPlayerId: string | null;          // ★ 내 playerId (WELCOME에서 추출)
  lastError: { code: string; message: string; ts: number } | null;
  lastActions: Record<number, LastAction>;  // seat → 최근 액션 (1.5초 후 사라짐)
  allInBanner: { playerId: string; nickname: string; amount: number; ts: number } | null;
  dramaticMoment: { type: 'bad_beat' | 'cooler'; winnerNickname: string; winnerHand: string; loserNickname: string; loserHand: string; ts: number } | null;
  onExternalPlayerAction: ((seat: number, action: number, amount: number) => void) | null;
  showResult: boolean;
  serverSeedHash: string | null;
  equities: { playerId: string; equity: number }[] | null;
  chatMessages: { playerId: string; nickname: string; message: string; time: number }[];
  tournaments: any[];
  shownCards: Record<string, any[]>;      // playerId → cards (쇼다운 공개)
  rabbitCards: any[];                      // Rabbit Hunt 결과
  handHistoryRecords: any[];               // Hand History 뷰어
  showMuckPrompt: boolean;                 // 승리 후 Show/Muck 선택
  runItTwiceRequest: boolean;              // Run It Twice 요청 대기
  insuranceOffer: { premium: number; payout: number; equity: number; outs: number } | null;
  cashOutOffer: { equity: number; potShare: number; offerAmount: number; feeRate: number; expiresAt: number } | null;
  isSittingOut: boolean;
  isDealing: boolean;                       // 카드 딜링 중

  setConnected: (v: boolean) => void;
  handleServerMessage: (msg: ServerMessage) => void;
  resetRoom: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  connected: false,
  rooms: [],
  currentRoomId: null,
  gameState: null,
  myCards: [],
  isMyTurn: false,
  turnInfo: null,
  winners: null,
  emptySeats: [],
  runItBoards: null,
  chatMessagesUnread: 0,
  myPlayerId: null,
  lastError: null,
  lastActions: {},
  allInBanner: null,
  dramaticMoment: null,
  onExternalPlayerAction: null,
  showResult: false,
  serverSeedHash: null,
  equities: null,
  chatMessages: [],
  tournaments: [],
  shownCards: {},
  rabbitCards: [],
  handHistoryRecords: [],
  showMuckPrompt: false,
  runItTwiceRequest: false,
  insuranceOffer: null,
  cashOutOffer: null,
  isSittingOut: false,
  isDealing: false,

  setConnected: (v) => set({ connected: v }),

  // ★ resetRoom — 방 이탈 시 모든 인-게임 state 초기화.
  // ROOM_LEFT 뿐 아니라 ROOM_JOINED (새 방 이동)에서도 사용해서 stale state 누수 방지.
  // 유지: myPlayerId (WS 세션 식별), rooms (로비 목록), chatMessages (채팅 히스토리)
  resetRoom: () => set({
    currentRoomId: null, gameState: null,
    myCards: [], isDealing: false,
    isMyTurn: false, turnInfo: null,
    winners: null, showResult: false, equities: null,
    lastActions: {}, allInBanner: null, dramaticMoment: null,
    emptySeats: [], runItBoards: null,
    shownCards: {}, rabbitCards: [],
    showMuckPrompt: false, runItTwiceRequest: false,
    insuranceOffer: null, cashOutOffer: null,
    isSittingOut: false,
  }),

  handleServerMessage: (msg) => {
    // Debug: 모든 서버 메시지 로깅
    console.log(`[GAME] ${msg.type}`, msg);

    switch (msg.type) {
      case 'WELCOME':
        // ★ 연결 직후 서버가 알려주는 내 playerId — hero 식별 핵심
        console.log(`[GAME] WELCOME — myPlayerId=${(msg as any).playerId}`);
        set({ myPlayerId: (msg as any).playerId });
        break;
      case 'RECONNECTED' as any:
        console.log(`[GAME] RECONNECTED to room ${(msg as any).roomId} seat=${(msg as any).seat}`);
        set({ lastError: { code: 'RECONNECTED', message: `이전 게임에 재접속됨 (좌석 ${(msg as any).seat + 1}, 칩 ₩${Math.round((msg as any).stack/100).toLocaleString()})`, ts: Date.now() } });
        break;
      case 'ROOM_LIST':
        console.log(`[GAME] Received ${msg.rooms.length} rooms`);
        set({ rooms: msg.rooms });
        break;
      case 'ROOM_JOINED':
        console.log(`[GAME] Joined room: ${msg.roomId}`);
        // ★ 방 이동 시 모든 이전 방 state를 원자적으로 초기화 + 새 state 설정
        // 단일 set() 호출로 intermediate state (currentRoomId:null) 노출 방지
        set({
          // 새 방 state
          currentRoomId: msg.roomId,
          gameState: msg.state,
          // 이전 방 stale state 일괄 clear
          myCards: [], isDealing: false,
          isMyTurn: false, turnInfo: null,
          winners: null, showResult: false, equities: null,
          lastActions: {}, allInBanner: null, dramaticMoment: null,
          emptySeats: [], runItBoards: null,
          shownCards: {}, rabbitCards: [],
          showMuckPrompt: false, runItTwiceRequest: false,
          insuranceOffer: null, cashOutOffer: null,
          isSittingOut: false,
        });
        break;
      case 'ROOM_LEFT':
        get().resetRoom();
        break;
      case 'GAME_STATE':
        set({ gameState: msg.state, isMyTurn: false, winners: null, showResult: false, equities: null });
        break;
      case 'DEAL_CARDS':
        // 딜링 애니메이션 시작 + 카드 즉시 저장
        // ★ playerId가 함께 오면 myPlayerId 저장 (이후 PLAYER_ACTION 비교용)
        set({
          isDealing: true,
          myCards: msg.cards,
          myPlayerId: (msg as any).playerId || get().myPlayerId,
        });
        playSound('cardDeal');
        // 1초 후 딜링 애니메이션 종료
        setTimeout(() => set({ isDealing: false }), 1000);
        speakNewHand();
        // 내 핸드 시작 — statsStore에 기록
        try {
          const handNum = get().gameState?.handNumber || Date.now();
          useStatsStore.getState().onHandStart(handNum);
        } catch {}
        break;
      case 'COMMUNITY_CARDS':
        set(s => ({
          gameState: s.gameState ? { ...s.gameState, communityCards: msg.cards, phase: msg.phase } : null,
        }));
        playSound('cardFlip');
        // 딜러 음성 — 페이즈별
        {
          const phaseStr = String(msg.phase || '').toUpperCase();
          if (phaseStr === 'FLOP') speakFlop();
          else if (phaseStr === 'TURN') speakTurn();
          else if (phaseStr === 'RIVER') speakRiver();
        }
        try { useStatsStore.getState().onPhaseChange(String(msg.phase || 'FLOP')); } catch {}
        break;
      case 'YOUR_TURN': {
        // 서버 deadline 보정 — 서버가 보낸 deadline(절대 시각)을 클라 시계로 변환
        const msgAny = msg as any;
        const srvTime: number | undefined = msgAny.serverTime;
        const srvDeadline: number | undefined = msgAny.deadline;
        let clientDeadline: number | undefined;
        if (typeof srvDeadline === 'number') {
          const offset = srvTime ? (Date.now() - srvTime) : 0;
          clientDeadline = srvDeadline + offset;
        } else if (typeof msg.timeoutMs === 'number') {
          // 폴백: deadline 없으면 로컬 기준
          clientDeadline = Date.now() + msg.timeoutMs;
        }
        set({
          isMyTurn: true,
          turnInfo: {
            timeoutMs: msg.timeoutMs,
            deadline: clientDeadline,
            serverTime: srvTime,
            minBet: msg.minBet,
            maxBet: msg.maxBet,
            callAmount: msg.callAmount,
            equity: msgAny.equity,
          },
        });
        playSound('myTurn');
        break;
      }
      case 'PLAYER_ACTION': {
        set({ isMyTurn: false });
        // 액션별 사운드
        if (msg.action === 0) playSound('fold');
        else if (msg.action === 1) playSound('check');
        else if (msg.action === 2) playSound('call');
        else if (msg.action === 3) playSound('raise');
        else if (msg.action === 4) playSound('allIn');
        else playSound('chipBet');

        const myId = get().myPlayerId;

        // ★ 내가 폴드했으면 hole cards 즉시 클리어 (관전 모드 카드 잔존 버그 수정)
        if (msg.action === 0 && myId && msg.playerId === myId) {
          set({ myCards: [] });
        }

        // 액션 라벨 업데이트 — 플레이어 seat 찾기
        const st = get().gameState;
        const actingPlayer = st?.players?.find((p: any) => p.id === msg.playerId);
        if (actingPlayer) {
          const seat = actingPlayer.seat;
          // 외부 콜백 호출 (다른 유저 칩 플라이 트리거) — myPlayerId로 정확히 비교
          try {
            if (myId && msg.playerId !== myId) {
              get().onExternalPlayerAction?.(seat, msg.action, msg.amount || 0);
            }
          } catch {}
          const action: LastAction = {
            playerId: msg.playerId,
            seat,
            action: msg.action,
            amount: msg.amount || 0,
            timestamp: Date.now(),
          };
          set(s => ({
            lastActions: { ...s.lastActions, [seat]: action },
          }));
          // 1.8초 후 자동 제거
          setTimeout(() => {
            set(s => {
              if (s.lastActions[seat]?.timestamp === action.timestamp) {
                const next = { ...s.lastActions };
                delete next[seat];
                return { lastActions: next };
              }
              return {};
            });
          }, 1800);
        }

        // All-in 풀스크린 배너 + 딜러 음성
        if (msg.action === 4 && actingPlayer) {
          set({
            allInBanner: {
              playerId: msg.playerId,
              nickname: actingPlayer.nickname || 'Player',
              amount: msg.amount || 0,
              ts: Date.now(),
            },
          });
          speakAllIn(actingPlayer.nickname);
          setTimeout(() => {
            set(s => {
              if (s.allInBanner?.ts === Date.now() - 2000) return {};
              return { allInBanner: null };
            });
          }, 2500);
        }

        // 내 액션이면 stats 기록
        try {
          if (myId && msg.playerId === myId) {
            const phase = String(get().gameState?.phase || 'PREFLOP');
            useStatsStore.getState().onMyAction(msg.action, msg.amount || 0, phase);
          }
        } catch {}
        break;
      }
      case 'HAND_RESULT': {
        const m = msg as any;
        // 히스토리 자동 누적 (최근 50개 보관)
        const record = {
          handNumber: m.handNumber,
          pot: m.pot,
          rake: m.rake,
          winners: m.winners,
          board: m.board,
          timestamp: Date.now(),
        };
        set(s => ({
          winners: msg.winners,
          showResult: true,
          isMyTurn: false,
          handHistoryRecords: [...s.handHistoryRecords.slice(-49), record],
        }));
        playSound('win');
        // 딜러 음성 — 승자 발표
        if (msg.winners && msg.winners[0]) {
          const w = msg.winners[0] as any;
          speakWinner(w.nickname || 'Winner', w.handResult?.description);
        }
        setTimeout(() => set({ showResult: false }), 3000);

        // 내 통계 기록 (statsStore) + 카드 클리어
        // 핸드 종료 시 hole cards 클리어 (다음 딜링까지 빈 상태)
        set({ myCards: [] });
        try {
          const myId = get().myPlayerId;
          if (myId) {
            const myWin = (m.winners || []).find((w: any) => w.playerId === myId);
            const won = !!myWin;
            const result: 'win' | 'lose' | 'fold' | 'split' =
              won ? (m.winners.length > 1 ? 'split' : 'win')
                  : (get().gameState?.players?.find((p: any) => p.id === myId)?.folded ? 'fold' : 'lose');
            useStatsStore.getState().onHandEnd({
              handNumber: m.handNumber || 0,
              tableName: m.tableName || get().gameState?.roomName,
              pot: m.pot || 0,
              myWin: myWin?.amount || 0,
              won,
              board: m.board || [],
              result,
            });
          }
        } catch (e) {
          console.warn('[stats] onHandEnd failed:', e);
        }
        break;
      }
      case 'PLAYER_JOINED':
        set(s => {
          if (!s.gameState) return {};
          return { gameState: { ...s.gameState, players: [...s.gameState.players.filter(p => p.id !== msg.player.id), msg.player] } };
        });
        break;
      case 'PLAYER_LEFT':
        set(s => {
          if (!s.gameState) return {};
          return { gameState: { ...s.gameState, players: s.gameState.players.filter(p => p.id !== msg.playerId) } };
        });
        break;
      case 'PROVABLY_FAIR_HASH':
        set({ serverSeedHash: msg.serverSeedHash });
        break;
      case 'ALLIN_EQUITY':
        set({ equities: msg.equities });
        break;
      case 'CHAT_MESSAGE':
        set(s => ({
          chatMessages: [...s.chatMessages.slice(-49), {
            playerId: msg.playerId, nickname: msg.nickname,
            message: msg.message, time: Date.now(),
          }],
          chatMessagesUnread: s.chatMessagesUnread + 1,
        }));
        playSound('click');
        break;
      case 'EMPTY_SEATS':
        set({ emptySeats: (msg as any).seats || [] });
        break;
      case 'SEAT_CHANGED':
        // 서버가 GAME_STATE 재전송하므로 UI는 자동 반영
        break;
      case 'TOP_UP_RESULT':
        if ((msg as any).success) {
          playSound('chipBet');
        }
        break;
      case 'TOP_UP':
        // 다른 플레이어의 top-up은 gameState로 들어옴
        break;
      case 'RUN_IT_THRICE':
        set({ runItBoards: (msg as any).boards || [(msg as any).board1, (msg as any).board2, (msg as any).board3] });
        break;
      case 'BAD_BEAT':
      case 'COOLER': {
        const m = msg as any;
        const isBadBeat = msg.type === 'BAD_BEAT';
        set({
          dramaticMoment: {
            type: isBadBeat ? 'bad_beat' : 'cooler',
            winnerNickname: m.winnerNickname,
            winnerHand: m.winnerHand,
            loserNickname: m.loserNickname,
            loserHand: m.loserHand,
            ts: Date.now(),
          },
        });
        playSound('showdown');
        setTimeout(() => set({ dramaticMoment: null }), 4500);
        break;
      }
      case 'TOURNAMENT_LIST':
        set({ tournaments: msg.tournaments });
        break;
      case 'CARDS_SHOWN':
        // 쇼다운: 상대 카드 공개
        set(s => ({
          shownCards: { ...s.shownCards, [(msg as any).playerId]: (msg as any).cards },
        }));
        playSound('showdown');
        break;
      case 'RABBIT_HUNT_RESULT':
        set({ rabbitCards: (msg as any).cards ?? [] });
        break;
      case 'HAND_HISTORY':
        set({ handHistoryRecords: (msg as any).records ?? [] });
        break;
      case 'SHOW_MUCK_PROMPT':
        set({ showMuckPrompt: true });
        setTimeout(() => set({ showMuckPrompt: false }), 8000); // 8초 후 자동 Muck
        break;
      case 'RUN_IT_TWICE':
        // 서버에서 두 번째 보드 결과 수신
        break;
      case 'CASH_OUT_OFFER':
        set({ cashOutOffer: {
          equity: (msg as any).equity,
          potShare: (msg as any).potShare,
          offerAmount: (msg as any).offerAmount,
          feeRate: (msg as any).feeRate,
          expiresAt: (msg as any).expiresAt,
        }});
        playSound('myTurn');
        break;
      case 'CASH_OUT_RESULT':
        set({ cashOutOffer: null });
        break;
      case 'INSURANCE_OFFER':
        set({ insuranceOffer: { premium: (msg as any).premium, payout: (msg as any).payout, equity: (msg as any).equity, outs: (msg as any).outs } });
        break;
      case 'PLAYER_SIT_OUT':
      case 'PLAYER_SIT_IN':
        break;
        break;
      case 'ERROR':
        console.error(`[Server] ${msg.code}: ${msg.message}`);
        // SIT_FAILED 등 즉시 표시 가능한 에러는 lastError 로 노출 (UI에서 toast)
        set({ lastError: { code: msg.code, message: msg.message, ts: Date.now() } });
        break;
    }
  },
}));
