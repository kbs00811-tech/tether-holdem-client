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

  setConnected: (v) => set({ connected: v }),

  resetRoom: () => set({
    currentRoomId: null, gameState: null, myCards: [],
    isMyTurn: false, turnInfo: null, winners: null,
    showResult: false, equities: null,
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
      case 'ERROR':
        console.error(`[Server] ${msg.code}: ${msg.message}`);
        break;
    }
  },
}));
