/**
 * TETHER.BET Holdem Poker - Core Type Definitions
 * Ported from Java PokerAces with security fixes
 */

// ============================================================
// Card Types
// ============================================================

export enum Suit {
  CLUB = 1,    // 클럽 ♣
  HEART = 2,   // 하트 ♥
  DIAMOND = 3, // 다이아 ♦
  SPADE = 4,   // 스페이드 ♠
}

export enum Rank {
  TWO = 2, THREE = 3, FOUR = 4, FIVE = 5,
  SIX = 6, SEVEN = 7, EIGHT = 8, NINE = 9,
  TEN = 10, JACK = 11, QUEEN = 12, KING = 13, ACE = 14,
}

export interface Card {
  value: number;   // 1-52 (내부 식별자)
  suit: Suit;      // 1-4
  rank: Rank;      // 2-14 (Ace=14)
}

// ============================================================
// Hand Evaluation Types
// ============================================================

export enum HandRank {
  HIGH_CARD = 1,
  ONE_PAIR = 2,
  TWO_PAIR = 3,
  THREE_OF_A_KIND = 4,
  STRAIGHT = 5,
  FLUSH = 6,
  FULL_HOUSE = 7,
  FOUR_OF_A_KIND = 8,
  STRAIGHT_FLUSH = 9,
  ROYAL_FLUSH = 10,
}

export const HandRankNames: Record<HandRank, string> = {
  [HandRank.HIGH_CARD]: 'High Card',
  [HandRank.ONE_PAIR]: 'One Pair',
  [HandRank.TWO_PAIR]: 'Two Pair',
  [HandRank.THREE_OF_A_KIND]: 'Three of a Kind',
  [HandRank.STRAIGHT]: 'Straight',
  [HandRank.FLUSH]: 'Flush',
  [HandRank.FULL_HOUSE]: 'Full House',
  [HandRank.FOUR_OF_A_KIND]: 'Four of a Kind',
  [HandRank.STRAIGHT_FLUSH]: 'Straight Flush',
  [HandRank.ROYAL_FLUSH]: 'Royal Flush',
};

export interface HandResult {
  rank: HandRank;
  cards: Card[];       // 최고 5장
  kickers: number[];   // 비교용 숫자 배열 (내림차순)
  description: string; // "Pair of Aces"
}

// ============================================================
// Betting Types
// ============================================================

export enum BettingAction {
  FOLD = 0,
  CHECK = 1,
  CALL = 2,
  RAISE = 3,
  ALL_IN = 4,
  BET_QUARTER = 5,  // 1/4 pot
  BET_HALF = 6,     // 1/2 pot
  BET_FULL = 7,     // full pot
}

export interface BettingMove {
  action: BettingAction;
  amount: number;       // USDT 단위 (정수, 센트)
  playerId: string;
  timestamp: number;
}

// ============================================================
// Game State Types
// ============================================================

export enum GamePhase {
  WAITING = 'WAITING',       // 대기 (플레이어 모집)
  READY = 'READY',           // 게임 준비
  START = 'START',           // 게임 시작 (블라인드 징수)
  DEALING = 'DEALING',       // 카드 배분
  PRE_FLOP = 'PRE_FLOP',    // 프리플롭 베팅
  FLOP = 'FLOP',            // 플롭 (커뮤니티 3장 오픈)
  TURN = 'TURN',            // 턴 (4번째 커뮤니티 오픈)
  RIVER = 'RIVER',          // 리버 (5번째 커뮤니티 오픈)
  SHOWDOWN = 'SHOWDOWN',    // 쇼다운 (카드 공개)
  RESULT = 'RESULT',        // 결과 (정산)
  RESET = 'RESET',          // 초기화
}

export enum PlayerStatus {
  WAITING = 'WAITING',       // 방에 앉아있지만 게임 미참여
  ACTIVE = 'ACTIVE',         // 게임 참여 중
  FOLDED = 'FOLDED',         // 폴드
  ALL_IN = 'ALL_IN',         // 올인
  SIT_OUT = 'SIT_OUT',       // 자리 비움 (좌석 유지, 핸드 미참여)
  WAIT_BB = 'WAIT_BB',       // BB 도달 대기 (중간 입장)
  DISCONNECTED = 'DISCONNECTED', // 연결 끊김
}

// ============================================================
// Player Types
// ============================================================

export interface HudStats {
  vpip: number;   // Voluntarily Put in Pot %
  pfr: number;    // Preflop Raise %
  af: number;     // Aggression Factor
  type: 'nit' | 'tag' | 'lag' | 'maniac' | 'fish' | 'whale' | 'reg' | 'pro' | 'unknown';
  hands: number;  // 샘플 크기
}

export interface Player {
  id: string;
  nickname: string;
  avatarId: number;
  seat: number;           // 0-8 (좌석 번호)
  status: PlayerStatus;
  stack: number;          // 현재 칩 (USDT 센트 단위)
  handCards: Card[];      // 홀카드 2장
  currentBet: number;     // 현재 라운드 베팅액
  totalBet: number;       // 핸드 전체 베팅액
  isDealer: boolean;
  isSB: boolean;
  isBB: boolean;
  handResult?: HandResult;
  lastAction?: BettingAction;
  disconnectedAt?: number;
  hudStats?: HudStats;    // Smart HUD (본인 제외)
}

// ============================================================
// Room / Table Types
// ============================================================

export interface RoomConfig {
  id: string;
  name: string;
  maxPlayers: number;     // 2, 6, 9
  smallBlind: number;     // USDT 센트
  bigBlind: number;       // USDT 센트
  minBuyIn: number;       // 최소 바이인
  maxBuyIn: number;       // 최대 바이인
  rake: number;           // 레이크 % (예: 5 = 5%)
  rakeCapUSDT: number;    // 레이크 상한 USDT
  isPrivate: boolean;
  password?: string;
  isTournament: boolean;
  straddleEnabled: boolean;  // Straddle 허용
  bombPotEnabled: boolean;   // Bomb Pot 허용
  bombPotFrequency: number;  // N핸드마다 Bomb Pot (0=비활성)
  rabbitHuntEnabled: boolean; // Rabbit Hunt 허용
  waitForBBEnabled: boolean;  // Wait for BB 옵션 활성화
  showMuckChoice: boolean;    // Show/Muck 선택 허용
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  communityCards: Card[];  // 최대 5장
  pot: number;             // 메인 팟
  sidePots: SidePot[];     // 사이드 팟
  currentBet: number;      // 현재 라운드 최고 베팅
  dealerSeat: number;
  sbSeat: number;
  bbSeat: number;
  currentTurnSeat: number;
  handNumber: number;
  bettingRound: number;    // 0=preflop, 1=flop, 2=turn, 3=river
  lastRaiseAmount: number;
  minRaise: number;
  turnTimeoutMs: number;   // 턴 시간제한 (밀리초)
  turnStartedAt: number;
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

// ============================================================
// Tournament Types
// ============================================================

export interface TournamentConfig {
  id: string;
  name: string;
  buyIn: number;           // USDT
  startingStack: number;
  maxPlayers: number;
  blindLevels: BlindLevel[];
  prizeStructure: PrizeLevel[];
  startTime: number;       // Unix timestamp
  lateRegSeconds: number;
}

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationSeconds: number;
}

export interface PrizeLevel {
  minPlace: number;
  maxPlace: number;
  percentOfPool: number;
}

// ============================================================
// WebSocket Message Types
// ============================================================

// Client → Server
export type ClientMessage =
  | { type: 'JOIN_ROOM'; roomId: string; buyIn: number }
  | { type: 'LEAVE_ROOM' }
  | { type: 'SIT_DOWN'; seat: number; buyIn: number }
  | { type: 'STAND_UP' }
  | { type: 'BET'; action: BettingAction; amount?: number }
  | { type: 'CHAT'; message: string }
  | { type: 'GET_ROOMS' }
  | { type: 'GET_TOURNAMENTS' }
  | { type: 'JOIN_TOURNAMENT'; tournamentId: string }
  | { type: 'CANCEL_TOURNAMENT'; tournamentId: string }
  | { type: 'HEARTBEAT' }
  // V2 additions
  | { type: 'SIT_OUT' }                           // 자리 비움
  | { type: 'SIT_IN' }                            // 자리 복귀
  | { type: 'WAIT_FOR_BB'; enabled: boolean }     // BB 대기 옵션
  | { type: 'POST_BB' }                            // 즉시 데드 BB 내고 다음 핸드 입장
  | { type: 'SHOW_CARDS' }                        // 승자 카드 공개
  | { type: 'MUCK_CARDS' }                        // 승자 카드 숨김
  | { type: 'RABBIT_HUNT' }                       // 남은 커뮤니티 카드 보기
  | { type: 'STRADDLE'; enabled: boolean }         // Straddle 토글
  | { type: 'SET_PRE_ACTION'; action: BettingAction | null }
  | { type: 'SET_RUN_IT_TWICE'; enabled: boolean }
  | { type: 'SET_RUN_IT_MODE'; mode: 'off' | 'twice' | 'thrice' }
  | { type: 'SET_AUTO_TOPUP'; enabled: boolean; amount: number }
  | { type: 'TOP_UP'; amount: number }                 // 수동 재충전
  | { type: 'CHANGE_SEAT'; seat: number }              // 자리 변경
  | { type: 'GET_EMPTY_SEATS' }                        // 빈 자리 조회
  | { type: 'BUY_INSURANCE'; accept: boolean }
  | { type: 'CASH_OUT'; accept: boolean }
  | { type: 'SET_CLIENT_SEED'; seed: string }     // Provably Fair 클라이언트 시드
  | { type: 'VERIFY_HAND'; handId: string }       // 핸드 검증 요청
  | { type: 'GET_HAND_HISTORY'; limit?: number }
  | { type: 'GET_MY_STATS' }
  | { type: 'JOIN_WAITING_LIST'; roomId: string }  // 대기열 등록
  | { type: 'LEAVE_WAITING_LIST'; roomId: string } // 대기열 취소
  | { type: 'ADD_BOTS'; count: number };           // AI 봇 추가

// Server → Client
export type ServerMessage =
  | { type: 'WELCOME'; playerId: string; nickname: string }
  | { type: 'ROOM_LIST'; rooms: RoomInfo[] }
  | { type: 'ROOM_JOINED'; roomId: string; state: GameState }
  | { type: 'ROOM_LEFT' }
  | { type: 'GAME_STATE'; state: GameState }
  | { type: 'DEAL_CARDS'; cards: Card[]; seat: number }
  // V3 P1: DEALING_START — 서버가 broadcast, 클라는 정확한 타이밍에 애니메이션 시작
  | { type: 'DEALING_START'; startAt: number; durationMs: number; serverTime: number; handNumber: number }
  // V3 P2A: STREET_END — street 전환 직전 chip→pot 수집 애니 트리거
  | { type: 'STREET_END'; fromPhase: GamePhase; toPhase: GamePhase; pot: number; serverTime: number }
  | { type: 'COMMUNITY_CARDS'; cards: Card[]; phase: GamePhase }
  | { type: 'PLAYER_ACTION'; playerId: string; action: BettingAction; amount: number }
  | { type: 'YOUR_TURN'; timeoutMs: number; minBet: number; maxBet: number; callAmount: number }
  | { type: 'HAND_RESULT'; winners: WinnerInfo[]; pot: number; sidePots: SidePot[] }
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string; seat: number }
  | { type: 'CHAT_MESSAGE'; playerId: string; nickname: string; message: string }
  | { type: 'ERROR'; code: string; message: string }
  | { type: 'TOURNAMENT_LIST'; tournaments: TournamentInfo[] }
  | { type: 'TOURNAMENT_UPDATE'; data: TournamentState }
  // V2 additions
  | { type: 'PLAYER_SIT_OUT'; playerId: string; seat: number }
  | { type: 'PLAYER_SIT_IN'; playerId: string; seat: number }
  | { type: 'SHOW_MUCK_PROMPT'; timeoutMs: number }         // 승자에게 Show/Muck 선택
  | { type: 'CARDS_SHOWN'; playerId: string; cards: Card[];
      seat?: number; handDescription?: string;
      // 🎯 P0-1 (2026-04-28): best 5 — 클라이언트 highlight 용
      handResult?: { rank: number; cards: Card[]; description: string };
    } // 카드 공개됨
  | { type: 'RABBIT_HUNT_RESULT'; cards: Card[] }            // Rabbit Hunt 결과
  | { type: 'STRADDLE_POSTED'; playerId: string; amount: number }
  | { type: 'BOMB_POT_ANNOUNCED'; multiplier: number }
  | { type: 'PROVABLY_FAIR_HASH'; serverSeedHash: string; clientSeed: string; nonce: number }
  | { type: 'PROVABLY_FAIR_REVEAL'; serverSeed: string; serverSeedHash: string; clientSeed: string; nonce: number }
  | { type: 'HAND_VERIFICATION'; handId: string; isValid: boolean; deck: Card[] }
  | { type: 'ALLIN_EQUITY'; equities: { playerId: string; equity: number }[] }
  | { type: 'RUN_IT_TWICE'; board1: Card[]; board2: Card[]; boards?: Card[][] }
  | { type: 'RUN_IT_THRICE'; board1: Card[]; board2: Card[]; board3: Card[]; boards?: Card[][] }
  | { type: 'BAD_BEAT'; winnerId: string; winnerNickname: string; winnerHand: string; loserId: string; loserNickname: string; loserHand: string }
  | { type: 'COOLER'; winnerId: string; winnerNickname: string; winnerHand: string; loserId: string; loserNickname: string; loserHand: string }
  | { type: 'TOP_UP_RESULT'; success: boolean; amount: number }
  | { type: 'TOP_UP'; playerId: string; amount: number; newStack: number }
  | { type: 'SEAT_CHANGED'; playerId: string; oldSeat: number; newSeat: number }
  | { type: 'EMPTY_SEATS'; seats: number[] }
  | { type: 'INSURANCE_OFFER'; premium: number; payout: number; equity: number; outs: number }
  | { type: 'CASH_OUT_OFFER'; equity: number; potShare: number; offerAmount: number; feeRate: number; expiresAt: number }
  | { type: 'CASH_OUT_RESULT'; accepted: boolean; amount: number }
  | { type: 'TIME_BANK_STARTED'; playerId: string; seconds: number }
  | { type: 'HAND_HISTORY'; records: any[] }
  | { type: 'MY_STATS'; stats: { handsPlayed: number; handsWon: number; totalProfit: number; winRate: number } }
  | { type: 'WAITING_LIST_UPDATE'; roomId: string; position: number; totalWaiting: number }
  | { type: 'WAITING_LIST_SEAT_AVAILABLE'; roomId: string; seat: number }
  | { type: 'AUTO_TOP_UP'; playerId: string; amount: number }
  | { type: 'ANTES_POSTED'; ante: number; pot: number }
  | { type: 'POST_BB_CONFIRMED'; playerId: string; seat: number }
  | { type: 'DEAD_BB_POSTED'; playerId: string; seat: number; amount: number }
  | { type: 'REALITY_CHECK'; message: string; sessionMinutes: number }
  | { type: 'RG_LIMIT_WARNING'; limitType: string; message: string };

export interface RoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  phase: GamePhase;
  waitingListCount: number;     // 대기열 인원
  straddleEnabled: boolean;
  variant: string;
  isPrivate?: boolean;          // 비밀번호 방
  spectatorCount?: number;      // 관전자 수
}

export interface WinnerInfo {
  playerId: string;
  nickname: string;
  amount: number;
  handResult: HandResult;
  potType: 'main' | 'side';
}

export interface TournamentInfo {
  id: string;
  name: string;
  buyIn: number;
  guaranteedPrize: number;
  playerCount: number;
  maxPlayers: number;
  startTime: number;
  status: 'registering' | 'running' | 'finished';
}

export interface TournamentState {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  nextLevelIn: number;
  playersRemaining: number;
  myRank: number;
  totalPlayers: number;
}
