export type GameStage = 
  | "waiting"        // 대기 상태 (플레이어 부족)
  | "ready"          // 게임 시작 준비
  | "pre-flop"       // 플롭 전
  | "flop"           // 플롭 (3장)
  | "turn"           // 턴 (4장)
  | "river"          // 리버 (5장)
  | "showdown"       // 카드 공개
  | "result";        // 결과 표시

export type PlayerStatus =
  | "empty"          // 빈 좌석
  | "waiting"        // 앉아있지만 게임 미참여
  | "active"         // 게임 참여 중
  | "turn"           // 현재 턴
  | "folded"         // 폴드
  | "all-in"         // 올인
  | "disconnected"   // 연결 끊김
  | "sitting-out";   // 앉기/일어나기

export interface Card {
  rank: string;
  suit: "hearts" | "diamonds" | "clubs" | "spades";
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  stack: number;
  bet: number;
  cards?: Card[];
  status: PlayerStatus;
  timeBank: number;
  isDealer?: boolean;
  isSmallBlind?: boolean;
  isBigBlind?: boolean;
}

export interface Pot {
  amount: number;
  eligible: string[]; // player IDs
}

export interface GameState {
  stage: GameStage;
  pot: number;
  sidePots: Pot[];
  communityCards: Card[];
  currentPlayer?: string;
  dealer: number;
  smallBlind: number;
  bigBlind: number;
}
