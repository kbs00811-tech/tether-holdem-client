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

interface TurnInfo {
  timeoutMs: number;
  minBet: number;
  maxBet: number;
  callAmount: number;
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
  isSittingOut: boolean;

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
  isSittingOut: false,

  setConnected: (v) => set({ connected: v }),

  resetRoom: () => set({
    currentRoomId: null, gameState: null, myCards: [],
    isMyTurn: false, turnInfo: null, winners: null,
    showResult: false, equities: null,
    shownCards: {}, rabbitCards: [],
    showMuckPrompt: false, runItTwiceRequest: false, insuranceOffer: null,
  }),

  handleServerMessage: (msg) => {
    // Debug: 모든 서버 메시지 로깅
    console.log(`[GAME] ${msg.type}`, msg);

    switch (msg.type) {
      case 'ROOM_LIST':
        console.log(`[GAME] Received ${msg.rooms.length} rooms`);
        set({ rooms: msg.rooms });
        break;
      case 'ROOM_JOINED':
        console.log(`[GAME] Joined room: ${msg.roomId}`);
        set({ currentRoomId: msg.roomId, gameState: msg.state, winners: null, showResult: false });
        break;
      case 'ROOM_LEFT':
        get().resetRoom();
        break;
      case 'GAME_STATE':
        set({ gameState: msg.state, isMyTurn: false, winners: null, showResult: false, equities: null });
        break;
      case 'DEAL_CARDS':
        set({ myCards: msg.cards });
        playSound('cardDeal');
        break;
      case 'COMMUNITY_CARDS':
        set(s => ({
          gameState: s.gameState ? { ...s.gameState, communityCards: msg.cards, phase: msg.phase } : null,
        }));
        playSound('cardFlip');
        break;
      case 'YOUR_TURN':
        set({
          isMyTurn: true,
          turnInfo: { timeoutMs: msg.timeoutMs, minBet: msg.minBet, maxBet: msg.maxBet, callAmount: msg.callAmount },
        });
        playSound('myTurn');
        break;
      case 'PLAYER_ACTION':
        set({ isMyTurn: false });
        // 액션별 사운드
        if (msg.action === 0) playSound('fold');
        else if (msg.action === 1) playSound('check');
        else if (msg.action === 2) playSound('call');
        else if (msg.action === 3) playSound('raise');
        else if (msg.action === 4) playSound('allIn');
        else playSound('chipBet');
        break;
      case 'HAND_RESULT':
        set({ winners: msg.winners, showResult: true, isMyTurn: false });
        playSound('win');
        setTimeout(() => set({ showResult: false }), 5000);
        break;
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
        }));
        break;
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
      case 'INSURANCE_OFFER':
        set({ insuranceOffer: { premium: (msg as any).premium, payout: (msg as any).payout, equity: (msg as any).equity, outs: (msg as any).outs } });
        break;
      case 'PLAYER_SIT_OUT':
      case 'PLAYER_SIT_IN':
        break;
        break;
      case 'ERROR':
        console.error(`[Server] ${msg.code}: ${msg.message}`);
        break;
    }
  },
}));
