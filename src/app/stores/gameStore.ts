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
  // V3 P2A: street 전환 직전 chip→pot 수집 애니 콜백
  onStreetEnd: ((fromPhase: string, toPhase: string, pot: number) => void) | null;
  showResult: boolean;
  serverSeedHash: string | null;
  // V3 P2E-3: Provably Fair 검증 — 직전 핸드의 서버 시드 공개 (PROVABLY_FAIR_REVEAL)
  lastFairReveal: { serverSeed: string; serverSeedHash: string; clientSeed: string; nonce: number; handNumber?: number; ts: number } | null;
  // V3 Task 4 Phase A: 친구 초대 토큰 (CREATE_HEADSUP_INVITE 응답)
  headsupInvite: { token: string; url: string; expiresAt: number; createdAt: number } | null;
  // USE_HEADSUP_INVITE 성공 시 roomId 저장 → 라우터가 감지해서 해당 방 이동
  pendingInviteJoin: string | null;
  // V3 Task 4 Phase B: ROOM_CREATED 응답 → Lobby가 감지해 자동 입장
  pendingRoomCreated: { roomId: string; isPrivate: boolean } | null;
  // Private 방 입장 시 사용될 비밀번호 (JOIN_ROOM에 1회 첨부 후 clear)
  pendingJoinPassword: string | null;
  // V3 Task 4 Phase C: 방장 Rakeback 상태
  ownerRakeback: { pending: number; claimed: number; totalEarned: number; percent: number } | null;
  // V3 Task 4 Phase D: 방 생성 직후 자동 초대 모달 오픈 플래그 (GameTable 이 consume)
  autoOpenInvite: boolean;
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
  // V3 P2E-1: Time Bank 활성 상태 (기본 30초 초과 후 타임뱅크 진입)
  timeBankActive: { playerId: string; seconds: number; startedAt: number } | null;
  // V3 P1: 서버 기준 정확한 dealing 시작/종료 시각 (DEALING_START 이벤트 수신 시 set)
  //        클라는 이 값을 보고 정확한 타이밍에 애니메이션 재생
  dealingInfo: { startAt: number; durationMs: number; endAt: number; handNumber: number } | null;

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
  onStreetEnd: null,
  showResult: false,
  serverSeedHash: null,
  lastFairReveal: null,
  headsupInvite: null,
  pendingInviteJoin: null,
  pendingRoomCreated: null,
  pendingJoinPassword: null,
  ownerRakeback: null,
  autoOpenInvite: false,
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
  dealingInfo: null,
  timeBankActive: null,

  setConnected: (v) => set({ connected: v }),

  // ★ resetRoom — 방 이탈 시 모든 인-게임 state 초기화.
  // ROOM_LEFT 뿐 아니라 ROOM_JOINED (새 방 이동)에서도 사용해서 stale state 누수 방지.
  // 유지: myPlayerId (WS 세션 식별), rooms (로비 목록), chatMessages (채팅 히스토리)
  resetRoom: () => set({
    currentRoomId: null, gameState: null,
    myCards: [], isDealing: false, dealingInfo: null,
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
          myCards: [], isDealing: false, dealingInfo: null,
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
      case 'GAME_STATE': {
        // V3 P1 Spectator Parity: DEALING phase 중 입장한 클라는 DEALING_START 이벤트를
        // 놓칠 수 있으므로 GAME_STATE 에 내장된 dealingStartAt/dealingDurationMs 로부터
        // dealingInfo 를 재구성한다.
        const st: any = msg.state;
        // V18.1: showResult 활성(핸드 결과 표시 중) 이면 winners/showResult 보존
        //   → HAND_RESULT 직후 도착하는 GAME_STATE 가 승자 표시를 덮어쓰는 race condition 방지
        const isShowingResult = get().showResult;
        const updates: any = {
          gameState: msg.state,
          isMyTurn: false,
          equities: null,
          ...(isShowingResult ? {} : { winners: null, showResult: false }),
        };
        const cur = get().dealingInfo;
        const phaseStr = String(st?.phase || '').toUpperCase();
        if (
          phaseStr === 'DEALING' &&
          typeof st.dealingStartAt === 'number' &&
          typeof st.dealingDurationMs === 'number' &&
          (!cur || cur.handNumber !== (st.handNumber || 0))
        ) {
          const offset = 0; // serverTime 없으므로 클라/서버 시계 근사
          const startAt = st.dealingStartAt + offset;
          const durationMs = st.dealingDurationMs;
          updates.dealingInfo = {
            startAt,
            durationMs,
            endAt: startAt + durationMs,
            handNumber: st.handNumber || 0,
          };
          updates.isDealing = true;
          const holdMs = Math.max(500, startAt + durationMs - Date.now());
          setTimeout(() => {
            const cur2 = get().dealingInfo;
            if (cur2 && cur2.handNumber === (st.handNumber || 0)) {
              set({ isDealing: false, dealingInfo: null });
            }
          }, holdMs);
        }
        set(updates);
        break;
      }
      case 'DEALING_START' as any: {
        // V3 P1: 서버가 DEALING phase 진입 시 broadcast — 모든 클라(관전자 포함) 동일 타이밍 애니메이션
        // V3 P2D BUGFIX: 새 핸드 시작 시 이전 핸드의 shownCards/winners/rabbitCards 모두 clear
        //   (이전 버그: 관전자 모드에서 이전 핸드의 CARDS_SHOWN 결과가 잔존하여 카드 누설)
        const m = msg as any;
        const offset = typeof m.serverTime === 'number' ? (Date.now() - m.serverTime) : 0;
        const startAt = (m.startAt || Date.now()) + offset;
        const durationMs = Math.max(1000, Math.min(10000, m.durationMs || 3500));
        set({
          isDealing: true,
          dealingInfo: {
            startAt,
            durationMs,
            endAt: startAt + durationMs,
            handNumber: m.handNumber || 0,
          },
          // ★ 핵심 수정: 새 핸드에선 이전 핸드 카드 노출 일체 제거
          shownCards: {},
          winners: null,
          showResult: false,
          equities: null,
          rabbitCards: [],
          runItBoards: null,
        });
        playSound('cardDeal');
        speakNewHand();
        // durationMs 후 자동 종료 (클라 시계 기준)
        const holdMs = Math.max(500, startAt + durationMs - Date.now());
        setTimeout(() => {
          const cur = get().dealingInfo;
          if (cur && cur.handNumber === (m.handNumber || 0)) {
            set({ isDealing: false, dealingInfo: null });
          }
        }, holdMs);
        break;
      }
      case 'DEAL_CARDS':
        // V3 P1: DEALING_START가 isDealing/dealingInfo 관리. 여기서는 myCards만 저장.
        // ★ playerId가 함께 오면 myPlayerId 저장 (이후 PLAYER_ACTION 비교용)
        set({
          myCards: msg.cards,
          myPlayerId: (msg as any).playerId || get().myPlayerId,
        });
        // DEALING_START가 오지 않은 구버전 서버 폴백
        if (!get().dealingInfo) {
          set({ isDealing: true });
          playSound('cardDeal');
          setTimeout(() => set({ isDealing: false }), 1000);
          speakNewHand();
        }
        // 내 핸드 시작 — statsStore에 기록
        try {
          const handNum = get().gameState?.handNumber || Date.now();
          useStatsStore.getState().onHandStart(handNum);
        } catch {}
        break;
      case 'STREET_END' as any: {
        // V3 P2A: 서버가 street 전환 직전 broadcast — 클라는 지금 모든 플레이어 베팅 칩을 팟으로 수집
        const m = msg as any;
        try {
          get().onStreetEnd?.(String(m.fromPhase || ''), String(m.toPhase || ''), m.pot || 0);
        } catch {}
        playSound('chipBet');
        break;
      }
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
        // V3 P2E-1: 새 턴 시작 시 이전 timeBank 상태 clear
        set({ timeBankActive: null });
        break;
      }
      case 'TIME_BANK_STARTED' as any: {
        // V3 P2E-1: 서버가 기본 30초 만료 후 Time Bank 진입 — 클라 UI 빨간 경고
        const m = msg as any;
        set({
          timeBankActive: {
            playerId: m.playerId,
            seconds: m.seconds || 30,
            startedAt: Date.now(),
          },
        });
        playSound('myTurn');
        break;
      }
      case 'PLAYER_ACTION': {
        set({ isMyTurn: false, timeBankActive: null });
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
      case 'OWNER_RAKEBACK_STATUS' as any: {
        const m = msg as any;
        set({
          ownerRakeback: {
            pending: m.pending || 0,
            claimed: m.claimed || 0,
            totalEarned: m.totalEarned || 0,
            percent: m.percent || 20,
          },
        });
        break;
      }
      case 'OWNER_RAKEBACK_CLAIMED' as any: {
        const m = msg as any;
        if (m.success) {
          set((s) => ({
            ownerRakeback: s.ownerRakeback
              ? { ...s.ownerRakeback, pending: 0, claimed: s.ownerRakeback.claimed + (m.amount || 0) * 100 }
              : null,
            lastError: { code: 'RAKEBACK_OK', message: `${m.amount?.toLocaleString()}원 지갑에 입금되었습니다`, ts: Date.now() },
          }));
        } else {
          set({ lastError: { code: 'RAKEBACK_FAIL', message: m.error || '청구 실패', ts: Date.now() } });
        }
        break;
      }
      case 'ROOM_CREATED' as any: {
        // V3 Task 4 Phase B: 방 생성 완료 → Lobby 가 감지해 해당 방으로 이동 + 초대 모달 열기
        const m = msg as any;
        set({
          pendingRoomCreated: { roomId: m.roomId, isPrivate: !!m.isPrivate },
        });
        break;
      }
      case 'HEADSUP_INVITE_CREATED' as any: {
        // V3 Task 4 Phase A: 초대 토큰 생성 응답
        const m = msg as any;
        set({
          headsupInvite: {
            token: m.token,
            url: m.url,
            expiresAt: m.expiresAt,
            createdAt: Date.now(),
          },
        });
        break;
      }
      case 'HEADSUP_INVITE_USED' as any: {
        // V3 Task 4 Phase A: 초대 사용 응답 — 성공 시 pendingInviteJoin 에 roomId 저장
        //   Lobby 에서 이를 감지해 해당 방으로 navigate
        const m = msg as any;
        if (m.success && m.roomId) {
          set({
            pendingInviteJoin: m.roomId,
            lastError: { code: 'INVITE_OK', message: '초대 방에 입장합니다', ts: Date.now() },
          });
        } else {
          set({ lastError: { code: 'INVITE_FAIL', message: m.error || '초대 사용 실패', ts: Date.now() } });
        }
        break;
      }
      case 'PROVABLY_FAIR_REVEAL' as any: {
        // V3 P2E-3: 핸드 종료 시 서버 시드 공개 — 이전 hash 와 비교해 무결성 검증 가능
        const m = msg as any;
        set({
          lastFairReveal: {
            serverSeed: m.serverSeed,
            serverSeedHash: m.serverSeedHash,
            clientSeed: m.clientSeed,
            nonce: m.nonce,
            handNumber: m.handNumber,
            ts: Date.now(),
          },
        });
        break;
      }
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
      case 'CARDS_SHOWN': {
        // 쇼다운: 상대 카드 공개
        // V3 P2D-FIX: 쇼다운 사운드는 첫 번째 리빌에만 1회 재생 (여러 명 시 중복 방지)
        const hadShown = Object.keys(get().shownCards).length > 0;
        set(s => ({
          shownCards: { ...s.shownCards, [(msg as any).playerId]: (msg as any).cards },
        }));
        if (!hadShown) playSound('showdown');
        break;
      }
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
