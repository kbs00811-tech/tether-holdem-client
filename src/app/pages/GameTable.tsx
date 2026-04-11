import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, MessageSquare, Volume2, VolumeX, Zap, Users, MoreVertical, Shield } from "lucide-react";
import { Slider } from "../components/ui/slider";
import { PlayerSlot } from "../components/PlayerSlot";
import { PokerCard } from "../components/PokerCard";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { ChatPanel } from "../components/ChatPanel";
import { BuyInModal } from "../components/BuyInModal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "../stores/gameStore";
import { useSocket } from "../hooks/useSocket";
import { playSound } from "../hooks/useSound";

// Suit 변환: 서버(1-4) → 피그마("spades" etc.)
const SUIT_MAP: Record<number, "spades"|"hearts"|"diamonds"|"clubs"> = {
  1: "clubs", 2: "hearts", 3: "diamonds", 4: "spades",
};
const RANK_MAP: Record<number, string> = {
  2:"2",3:"3",4:"4",5:"5",6:"6",7:"7",8:"8",9:"9",10:"10",11:"J",12:"Q",13:"K",14:"A",
};

export default function GameTable() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { send } = useSocket();
  const {
    gameState, myCards, isMyTurn, turnInfo, winners, showResult,
    currentRoomId, serverSeedHash, equities, connected,
  } = useGameStore();

  const [raiseAmount, setRaiseAmount] = useState(400);
  const [showChat, setShowChat] = useState(false);
  const [showBuyInModal, setShowBuyInModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [seated, setSeated] = useState(false);

  // 방 목록
  const rooms = useGameStore(s => s.rooms);
  const [joinAttempted, setJoinAttempted] = useState(false);

  // 접속 시 방 목록 요청 + 자동 입장 — 단일 useEffect
  useEffect(() => {
    if (!connected || joinAttempted) return;

    console.log('[GAME] Connected! Requesting rooms then auto-join...');
    send({ type: 'GET_ROOMS' });

    // GET_ROOMS 응답을 기다린 후 첫 번째 방에 입장
    // 폴링: 500ms마다 rooms 확인, 최대 5초
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      const currentRooms = useGameStore.getState().rooms;
      const alreadyJoined = useGameStore.getState().currentRoomId;

      if (alreadyJoined) {
        console.log(`[GAME] Already in room: ${alreadyJoined}`);
        clearInterval(timer);
        return;
      }

      if (currentRooms.length > 0) {
        const target = currentRooms.find(r => r.id === tableId) ?? currentRooms[0];
        if (target) {
          console.log(`[GAME] Joining room: ${target.id} (${target.name})`);
          send({ type: 'JOIN_ROOM', roomId: target.id, buyIn: 0 });
          setJoinAttempted(true);
        }
        clearInterval(timer);
      } else if (attempts > 10) {
        console.warn('[GAME] No rooms after 5s, giving up');
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [connected]);

  // 방 입장 후: 먼저 봇 추가 → 그 다음 빈 좌석에 착석
  useEffect(() => {
    if (!currentRoomId || seated) return;

    // Step 1: 봇 먼저 추가 (1초 후)
    const botTimer = setTimeout(() => {
      console.log('[GAME] Adding bots first...');
      send({ type: 'ADD_BOTS', count: 3 });
    }, 1000);

    // Step 2: 봇 추가 후 빈 좌석에 착석 (3초 후 — 봇이 앉은 뒤)
    const sitTimer = setTimeout(() => {
      const state = useGameStore.getState().gameState;
      const players = state?.players ?? [];
      const occupied = new Set(players.map(p => p.seat));

      console.log(`[GAME] Occupied seats: ${[...occupied].join(',')} (${players.length} players)`);

      // 마지막 좌석(hero 위치)부터 역순 탐색
      let freeSeat = -1;
      for (let i = maxSeats - 1; i >= 0; i--) {
        if (!occupied.has(i)) { freeSeat = i; break; }
      }

      if (freeSeat < 0) {
        console.warn('[GAME] No free seats!');
        toast.error('Table is full');
        return;
      }

      // 서버 minBuyIn 사용
      const room = useGameStore.getState().rooms.find(r => r.id === currentRoomId);
      const buyIn = room?.minBuyIn ?? 10000;

      console.log(`[GAME] Auto-sitting at seat ${freeSeat}, buyIn=${buyIn}`);
      send({ type: 'SIT_DOWN', seat: freeSeat, buyIn });
      setSeated(true);
      setLocalPlayers(prev => ({
        ...prev,
        [freeSeat]: { name: "You", stack: buyIn / 100, bet: 0, avatar: 3, status: "active", cards: undefined },
      }));
      toast.success(`Seated at position ${freeSeat}`);
    }, 3000);

    return () => { clearTimeout(botTimer); clearTimeout(sitTimer); };
  }, [currentRoomId]);

  // 턴 시작 시 raiseAmount 초기화
  useEffect(() => {
    if (turnInfo) setRaiseAmount(turnInfo.minBet);
  }, [turnInfo]);

  // 서버 상태에서 데이터 추출
  const phase = gameState?.phase ?? "WAITING";
  const pot = gameState?.pot ?? 0;
  const handNumber = gameState?.handNumber ?? 0;
  const currentBet = gameState?.currentBet ?? 0;
  const communityCards = (gameState?.communityCards ?? []).map(c => ({
    suit: SUIT_MAP[c.suit] ?? "spades" as const,
    rank: (RANK_MAP[c.rank] ?? "A") as any,
  }));

  // 좌석 수 (6 or 8)
  const maxSeats = 8;

  // 로컬 플레이어 (서버 응답 전 즉시 표시용)
  const [localPlayers, setLocalPlayers] = useState<Record<number, any>>({});

  // 플레이어 매핑: 서버 데이터 우선, 없으면 로컬 데이터
  const serverPlayers = gameState?.players ?? [];
  const players: (any | undefined)[] = Array.from({ length: maxSeats }, (_, i) => {
    // 서버 플레이어 우선
    const p = serverPlayers.find(sp => sp.seat === i);
    if (p) {
      return {
        name: p.nickname,
        stack: p.stack / 100,
        bet: p.currentBet / 100,
        avatar: p.avatarId ?? i,
        status: p.status === "ACTIVE" ? "active" : p.status === "FOLDED" ? "folded" :
          p.status === "ALL_IN" ? "allin" : p.status === "DISCONNECTED" ? "disconnected" :
          p.status === "SIT_OUT" ? "sitting-out" : "waiting",
        isDealer: p.isDealer,
        isSmallBlind: p.isSB,
        isBigBlind: p.isBB,
        cards: undefined,
      };
    }
    // 로컬 플레이어 (서버 응답 전 즉시 표시)
    if (localPlayers[i]) return localPlayers[i];
    return undefined;
  });

  // 내 홀카드가 있는 좌석 = 나
  const myHoleCards = myCards.map(c => ({
    suit: SUIT_MAP[c.suit] ?? "spades" as const,
    rank: (RANK_MAP[c.rank] ?? "A") as any,
  }));
  const heroSeatIndex = serverPlayers.findIndex(p => p.handCards && p.handCards.length > 0);
  const heroSeat = heroSeatIndex >= 0 ? serverPlayers[heroSeatIndex]!.seat : (maxSeats === 6 ? 3 : 4);
  if (players[heroSeat] && myHoleCards.length > 0) {
    players[heroSeat].cards = myHoleCards;
  }

  const myStack = serverPlayers.find(p => p.seat === heroSeat)?.stack ?? 0;
  const canCheck = !turnInfo || turnInfo.callAmount <= 0;
  const callAmount = turnInfo?.callAmount ?? 0;
  const minRaise = turnInfo?.minBet ?? (currentBet * 2 || 400);
  const maxRaise = turnInfo?.maxBet ?? myStack;
  const blinds = `${(gameState?.sbSeat ?? 0) >= 0 ? "50/100" : "—"}`;

  // 베팅 액션
  const handleFold = useCallback(() => { send({ type: 'BET', action: 0 }); }, [send]);
  const handleCheck = useCallback(() => { send({ type: 'BET', action: 1 }); }, [send]);
  const handleCall = useCallback(() => { send({ type: 'BET', action: 2 }); }, [send]);
  const handleRaise = useCallback(() => { send({ type: 'BET', action: 3, amount: raiseAmount }); }, [send, raiseAmount]);
  const handleAllIn = useCallback(() => { send({ type: 'BET', action: 4 }); }, [send]);

  // 클릭한 좌석 번호 저장
  const [clickedSeat, setClickedSeat] = useState<number>(4);

  const handleSitClick = useCallback((seatIndex: number) => {
    if (seated) {
      toast.error('Already seated');
      return;
    }
    setClickedSeat(seatIndex);
    setShowBuyInModal(true);
  }, [seated]);

  const handleBuyIn = useCallback((amount: number) => {
    if (!currentRoomId) {
      toast.error('Connecting to table... try again in a moment');
      return;
    }

    // 빈 좌석 찾기
    const occupied = new Set(serverPlayers.map(p => p.seat));
    let targetSeat = clickedSeat;
    if (occupied.has(targetSeat)) {
      for (let i = 0; i < maxSeats; i++) {
        if (!occupied.has(i)) { targetSeat = i; break; }
      }
    }

    console.log(`[GAME] SIT_DOWN seat=${targetSeat} room=${currentRoomId}`);

    // 즉시 로컬에 아바타 표시
    setLocalPlayers(prev => ({
      ...prev,
      [targetSeat]: {
        name: "You", stack: amount, bet: 0, avatar: 3, status: "active", cards: undefined,
      },
    }));

    send({ type: 'SIT_DOWN', seat: targetSeat, buyIn: Math.round(amount * 100) });
    setSeated(true);
    setShowBuyInModal(false);
    toast.success(`Bought in for ₮${amount.toLocaleString()}`);
  }, [send, clickedSeat, serverPlayers, maxSeats, currentRoomId]);

  const handleLeave = useCallback(() => {
    send({ type: 'LEAVE_ROOM' });
    navigate('/');
  }, [send, navigate]);

  const getStageIndex = () => {
    if (phase === "FLOP") return 1;
    if (phase === "TURN") return 2;
    if (["RIVER","SHOWDOWN","RESULT"].includes(phase)) return 3;
    return 0;
  };

  const playerCount = serverPlayers.length;

  // Seats are positioned INSIDE the rim div (inset-x-[8%] inset-y-[4%])
  // So 0%,0% = rim top-left, 100%,100% = rim bottom-right
  // Rim is an oval with borderRadius 160 — seats follow the oval edge
  //
  //         [0]           0% top, center
  //     [8]     [7]       20% from top
  //   [1]         [6]     42% — widest
  //   [2]         [5]     58% — widest
  //     [3]     [4]       80% from top
  //
  // X follows oval curve: narrow at top/bottom, widest at middle
  // Seat layouts — 6-max and 8-max
  // Coordinates are % relative to the RIM div (inset-x-[8%] inset-y-[4%])
  //
  // 6-Max (가장 인기):
  //        [0]
  //   [5]       [1]
  //   [4]       [2]
  //        [3]        ← hero
  //
  // 8-Max:
  //     [7]  [0]  [1]
  //   [6]            [2]
  //   [5]            [3]
  //         [4]       ← hero
  //
  // 6-Max: 6 seats evenly on oval (60° apart)
  //        [0]           top
  //   [5]       [1]      upper
  //   [4]       [2]      lower
  //        [3]           bottom (hero)
  const LAYOUT_6: [number, number][] = [
    [50,  -5],    // 0: top center
    [108, 30],    // 1: right upper
    [108, 70],    // 2: right lower
    [50,  105],   // 3: bottom center (hero)
    [-8,  70],    // 4: left lower
    [-8,  30],    // 5: left upper
  ];

  // 8-Max: 8 seats evenly on oval (45° apart)
  //     [7]   [0]   [1]       top row — equal spacing
  //   [6]               [2]   mid row
  //   [5]               [3]   mid row
  //           [4]              bottom (hero)
  //
  // Vertical: 4 rows at -5%, 31%, 69%, 105% (equal 37% gaps)
  // Top row 3 seats: 20%, 50%, 80% (equal 30% gaps)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  // Portrait (mobile): tall oval
  const LAYOUT_8_PORTRAIT: [number, number][] = [
    [75,  -5],    // 0: top right
    [108, 31],    // 1: right upper
    [108, 69],    // 2: right lower
    [75,  105],   // 3: bottom right
    [25,  105],   // 4: bottom left (hero)
    [-8,  69],    // 5: left lower
    [-8,  31],    // 6: left upper
    [25,  -5],    // 7: top left
  ];

  // Landscape (desktop): wide oval — GGPoker style
  //     [7]    [0]    [1]
  //  [6]                  [2]
  //     [5]    [4]    [3]
  const LAYOUT_8_LANDSCAPE: [number, number][] = [
    [50,  -8],    // 0: top center
    [78,  -8],    // 1: top right
    [108, 50],    // 2: right center
    [78,  108],   // 3: bottom right
    [50,  108],   // 4: bottom center (hero)
    [22,  108],   // 5: bottom left
    [-8,  50],    // 6: left center
    [22,  -8],    // 7: top left
  ];

  const LAYOUT_8 = isDesktop ? LAYOUT_8_LANDSCAPE : LAYOUT_8_PORTRAIT;

  const seatPositionsData = maxSeats === 6 ? LAYOUT_6 : LAYOUT_8;
  // No separate seatPositions/betChipPos objects needed here —
  // they'll be placed inside the rim div below

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #0C1620 0%, #080E16 40%, #050A10 100%)" }}>

      {/* ====== TOP BAR — enlarged ====== */}
      <div className="shrink-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(8,12,20,0.9)", backdropFilter: "blur(20px) saturate(1.2)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <button onClick={handleLeave} className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <ArrowLeft className="h-5 w-5 text-[#6B7A90]" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.15)" }}>
            <Zap className="h-3.5 w-3.5 text-[#FF6B35]" />
            <span className="text-sm text-[#FF6B35] font-mono font-bold">{blinds}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <Users className="h-3.5 w-3.5 text-[#4A5A70]" />
            <span className="text-xs text-[#6B7A90] font-mono">{playerCount}/{maxSeats}</span>
          </div>
          {handNumber > 0 && (
            <span className="text-xs text-[#3D4F65] font-mono">#{handNumber}</span>
          )}
        </div>

        {/* Stage */}
        <div className="flex gap-1 rounded-full p-1" style={{ background: "rgba(0,0,0,0.35)" }}>
          {["P","F","T","R"].map((l,i) => {
            const active = i <= getStageIndex();
            const current = i === getStageIndex();
            return (
              <div key={l} className="relative">
                <div className="w-8 h-6 flex items-center justify-center rounded-full text-[10px] font-bold tracking-wider"
                  style={{ background: active ? "rgba(52,211,153,0.15)" : "transparent", color: active ? "#34D399" : "#1A2535" }}>{l}</div>
                {current && <motion.div className="absolute -bottom-0.5 left-1/2 w-1.5 h-0.5 rounded-full"
                  style={{ background: "#34D399", transform: "translateX(-50%)" }} layoutId="stage-dot" />}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => { send({ type: 'ADD_BOTS', count: 3 }); toast.success('AI bots joining...'); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
            style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.2)", color: "#FF6B35" }}>
            + Bots
          </button>
          {serverSeedHash && (
            <div className="px-2 py-1 rounded-md" style={{ background: "rgba(52,211,153,0.08)" }}>
              <Shield className="h-3.5 w-3.5 text-[#34D399]" />
            </div>
          )}
          {/* Hand History */}
          <button onClick={() => { send({ type: 'GET_HAND_HISTORY', limit: 10 }); toast.success('History loaded'); }}
            className="px-2 py-1 rounded-md text-[10px] font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.03)", color: "#4A5A70" }}>
            History
          </button>
          {/* Sit Out toggle */}
          {seated && (
            <button onClick={() => { send({ type: 'SIT_OUT' }); toast.success('Sitting out'); }}
              className="px-2 py-1 rounded-md text-[10px] font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.03)", color: "#4A5A70" }}>
              Sit Out
            </button>
          )}
          {/* Show Cards (after win) */}
          {showResult && (
            <button onClick={() => { send({ type: 'SHOW_CARDS' }); toast.success('Cards shown'); }}
              className="px-2 py-1 rounded-md text-[10px] font-semibold transition-all"
              style={{ background: "rgba(52,211,153,0.08)", color: "#34D399" }}>
              Show
            </button>
          )}
          <button onClick={() => setIsMuted(!isMuted)} className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            {isMuted ? <VolumeX className="h-4 w-4 text-[#4A5A70]" /> : <Volume2 className="h-4 w-4 text-[#4A5A70]" />}
          </button>
        </div>
      </div>

      {/* ====== TABLE AREA ====== */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[800px]"
            style={{ background: "radial-gradient(ellipse at 50% 25%, rgba(30,80,60,0.08) 0%, transparent 60%)" }} />
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-2 sm:px-4"
          style={{ perspective: "800px" }}>
          {/* Mobile: portrait 9:13, Desktop: landscape 16:10 */}
          <div className="relative w-full
            max-w-[380px] sm:max-w-[420px]
            md:max-w-[700px] lg:max-w-[850px] xl:max-w-[950px]
            h-full
            max-h-[520px] sm:max-h-[600px]
            md:max-h-[480px] lg:max-h-[550px] xl:max-h-[600px]"
            style={{
              aspectRatio: typeof window !== 'undefined' && window.innerWidth >= 768 ? "16/10" : "9/13",
              transform: typeof window !== 'undefined' && window.innerWidth >= 768
                ? "rotateX(12deg) translateY(-1%) scale(0.96)"
                : "rotateX(16deg) translateY(-2%) scale(0.95)",
              transformOrigin: "center 60%",
              transformStyle: "preserve-3d",
          }}>

            {/* Table shadows + rim */}
            <div className="absolute inset-x-[8%] inset-y-[4%]" style={{ borderRadius: 160, boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 100px rgba(0,0,0,0.4)" }} />

            {/* Neon glow rim — animated */}
            <motion.div
              className="absolute inset-x-[7.5%] inset-y-[3.5%]"
              animate={{
                boxShadow: [
                  "0 0 15px rgba(38,161,123,0.15), 0 0 30px rgba(38,161,123,0.05), inset 0 0 15px rgba(38,161,123,0.05)",
                  "0 0 25px rgba(38,161,123,0.25), 0 0 50px rgba(38,161,123,0.1), inset 0 0 25px rgba(38,161,123,0.08)",
                  "0 0 15px rgba(255,107,53,0.15), 0 0 30px rgba(255,107,53,0.05), inset 0 0 15px rgba(255,107,53,0.05)",
                  "0 0 25px rgba(255,107,53,0.2), 0 0 50px rgba(255,107,53,0.08), inset 0 0 25px rgba(255,107,53,0.06)",
                  "0 0 15px rgba(38,161,123,0.15), 0 0 30px rgba(38,161,123,0.05), inset 0 0 15px rgba(38,161,123,0.05)",
                ],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                borderRadius: 165,
                border: "1.5px solid rgba(38,161,123,0.12)",
              }}
            />

            {/* Dark rim body — SEATS ARE CHILDREN OF THIS DIV */}
            <div className="absolute inset-x-[8%] inset-y-[4%]" style={{ borderRadius: 160, background: "linear-gradient(180deg, #1E2A36 0%, #151E28 40%, #0E161E 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.3)", overflow: "visible" }}>
              {/* ===== PLAYERS — positioned relative to rim ===== */}
              {players.map((player, i) => (
                <div key={`seat-${i}`} className="z-20" style={{
                  position: "absolute",
                  left: `${seatPositionsData[i]![0]}%`,
                  top: `${seatPositionsData[i]![1]}%`,
                  transform: "translate(-50%,-50%)",
                }}>
                  <PlayerSlot position={i} player={player} isHero={i === heroSeat}
                    isCurrentTurn={gameState?.currentTurnSeat === i}
                    timeLeft={isMyTurn && i === heroSeat ? Math.max(0, (turnInfo?.timeoutMs ?? 30000) / 300) : undefined}
                    onSitDown={() => handleSitClick(i)} />
                </div>
              ))}

              {/* ===== BET CHIPS — 60% toward center ===== */}
              {players.map((p, i) => {
                if (!p || p.bet <= 0) return null;
                const bx = 50 + (seatPositionsData[i]![0] - 50) * 0.55;
                const by = 50 + (seatPositionsData[i]![1] - 50) * 0.55;
                return (
                  <motion.div key={`bet-${i}`} className="z-10" style={{
                    position: "absolute", left: `${bx}%`, top: `${by}%`, transform: "translate(-50%,-50%)",
                  }}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                    <div className="flex items-center gap-1">
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #3BE8A8, #1A9B6E)", boxShadow: "0 0 8px rgba(26,155,110,0.3)", border: "1.5px solid rgba(255,255,255,0.2)" }} />
                      <span className="text-[11px] font-mono font-bold" style={{ color: "#7EDBB8", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{p.bet}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="absolute inset-x-[9.5%] inset-y-[5%]" style={{ borderRadius: 150, background: "linear-gradient(180deg, #19232E 0%, #121A22 100%)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)" }} />

            {/* Neon pinstripe — subtle color shift */}
            <motion.div
              className="absolute inset-x-[10.5%] inset-y-[5.8%]"
              animate={{
                borderColor: [
                  "rgba(38,161,123,0.12)",
                  "rgba(38,161,123,0.2)",
                  "rgba(255,107,53,0.15)",
                  "rgba(255,215,0,0.1)",
                  "rgba(38,161,123,0.12)",
                ],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ borderRadius: 145, border: "1px solid rgba(38,161,123,0.12)" }}
            />

            {/* Felt */}
            <div className="absolute inset-x-[11%] inset-y-[6.2%] overflow-hidden" style={{
              borderRadius: 140,
              background: `radial-gradient(ellipse at 50% 40%, #1A7A50 0%, #167045 15%, #126540 30%, #0E5838 45%, #0B4C30 60%, #084028 75%, #063622 90%, #052E1C 100%)`,
              boxShadow: "inset 0 0 60px rgba(0,0,0,0.3), inset 0 -20px 40px rgba(0,0,0,0.12)",
            }}>
              <div className="absolute inset-x-[12%] inset-y-[10%]" style={{ borderRadius: 100, border: "1px solid rgba(255,255,255,0.03)" }} />
              <motion.div
                className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
                animate={{ opacity: [0.18, 0.35, 0.18] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="text-center">
                  <div className="text-4xl tracking-[0.4em]"
                    style={{
                      fontFamily: "'Orbitron', 'Rajdhani', 'Inter', sans-serif",
                      fontWeight: 900,
                      color: "#26A17B",
                      textShadow: "0 0 30px rgba(38,161,123,0.4), 0 0 60px rgba(38,161,123,0.15), 0 2px 4px rgba(0,0,0,0.5)",
                    }}>
                    TETHER
                  </div>
                  <div className="text-2xl tracking-[0.5em] mt-1"
                    style={{
                      fontFamily: "'Orbitron', 'Rajdhani', 'Inter', sans-serif",
                      fontWeight: 800,
                      color: "#FF6B35",
                      textShadow: "0 0 20px rgba(255,107,53,0.5), 0 0 40px rgba(255,107,53,0.2), 0 2px 4px rgba(0,0,0,0.5)",
                    }}>
                    POKER
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ===== COMMUNITY CARDS — deal from deck animation ===== */}
            <div className="absolute top-[37%] left-1/2 -translate-x-1/2 z-10">
              <div className="flex gap-1.5">
                <AnimatePresence>
                  {communityCards.map((card, i) => (
                    <motion.div key={`comm-${card.suit}-${card.rank}-${i}`}
                      initial={{ rotateY: 180, opacity: 0, x: -100 + i * 10, y: -60, scale: 0.3 }}
                      animate={{ rotateY: 0, opacity: 1, x: 0, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5, y: -20 }}
                      transition={{
                        delay: i * 0.15,
                        duration: 0.5,
                        type: "spring",
                        stiffness: 150,
                        damping: 15,
                      }}>
                      <div className="relative">
                        <PokerCard suit={card.suit} rank={card.rank} size="md" />
                        {/* Card shadow on table */}
                        <div className="absolute -bottom-1 left-1 right-1 h-2 rounded-full"
                          style={{ background: "rgba(0,0,0,0.3)", filter: "blur(3px)" }} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {/* Empty card slots */}
                {Array.from({ length: Math.max(0, 5 - communityCards.length) }).map((_, i) => (
                  <div key={`empty-${i}`} style={{
                    width: 54, height: 76, borderRadius: 6,
                    border: "1px dashed rgba(255,255,255,0.04)",
                    background: "rgba(255,255,255,0.01)",
                  }} />
                ))}
              </div>
            </div>

            {/* ===== POT — animated ===== */}
            {pot > 0 && (
              <motion.div
                className="absolute top-[49%] left-1/2 -translate-x-1/2 z-10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={pot}
              >
                <motion.div
                  className="px-4 py-1.5 rounded-full flex items-center gap-2"
                  animate={{
                    boxShadow: [
                      "0 4px 16px rgba(0,0,0,0.5), 0 0 0 rgba(229,184,0,0)",
                      "0 4px 16px rgba(0,0,0,0.5), 0 0 15px rgba(229,184,0,0.1)",
                      "0 4px 16px rgba(0,0,0,0.5), 0 0 0 rgba(229,184,0,0)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    background: "linear-gradient(135deg, rgba(6,10,16,0.9), rgba(15,20,30,0.9))",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(229,184,0,0.15)",
                  }}
                >
                  {/* Mini chip stack */}
                  <div className="flex gap-px">
                    {[0,1,2].map(j => (
                      <div key={j} style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: j === 0 ? "#E5B800" : j === 1 ? "#26A17B" : "#8B5CF6",
                        border: "1px solid rgba(255,255,255,0.2)",
                        marginLeft: j > 0 ? -3 : 0,
                      }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#7A6A3A] font-bold uppercase tracking-wider">POT</span>
                  <motion.span
                    key={pot}
                    initial={{ scale: 1.3, color: "#FFD700" }}
                    animate={{ scale: 1, color: "#E5B800" }}
                    className="text-[16px] font-mono font-black"
                    style={{ textShadow: "0 0 10px rgba(229,184,0,0.3)" }}
                  >
                    ₮{(pot / 100).toLocaleString()}
                  </motion.span>
                </motion.div>
              </motion.div>
            )}

            {/* Players and bet chips are now inside the rim div above */}

            {/* ===== WINNER OVERLAY — GGPoker style ===== */}
            <AnimatePresence>
              {showResult && winners && winners[0] && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                >
                  {/* Gold radial burst */}
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    style={{ background: "radial-gradient(circle at 50% 45%, rgba(255,215,0,0.15), transparent 60%)" }}
                  />

                  {/* Floating particles */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div key={`particle-${i}`}
                      className="absolute"
                      initial={{
                        x: 0, y: 0, opacity: 1, scale: 1,
                      }}
                      animate={{
                        x: (Math.random() - 0.5) * 200,
                        y: -100 - Math.random() * 150,
                        opacity: 0,
                        scale: 0,
                        rotate: Math.random() * 360,
                      }}
                      transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.3, ease: "easeOut" }}
                      style={{
                        top: "45%", left: "50%",
                        width: 6 + Math.random() * 6, height: 6 + Math.random() * 6,
                        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                        background: ["#FFD700", "#FFA500", "#FF6B35", "#26A17B", "#E5B800"][Math.floor(Math.random() * 5)],
                        boxShadow: "0 0 4px rgba(255,215,0,0.5)",
                      }}
                    />
                  ))}

                  {/* Winner card */}
                  <motion.div
                    initial={{ scale: 0.5, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="relative"
                  >
                    {/* Glow ring */}
                    <motion.div className="absolute -inset-4 rounded-3xl"
                      animate={{ boxShadow: [
                        "0 0 20px rgba(255,215,0,0.2), 0 0 40px rgba(255,215,0,0.1)",
                        "0 0 30px rgba(255,215,0,0.3), 0 0 60px rgba(255,215,0,0.15)",
                        "0 0 20px rgba(255,215,0,0.2), 0 0 40px rgba(255,215,0,0.1)",
                      ]}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />

                    <div className="px-8 py-5 rounded-2xl text-center relative"
                      style={{
                        background: "linear-gradient(135deg, rgba(10,15,25,0.95), rgba(15,20,30,0.95))",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,215,0,0.25)",
                      }}>
                      {/* Trophy icon */}
                      <motion.div
                        animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-3xl mb-2"
                      >🏆</motion.div>

                      <div className="text-[#FFD700] text-lg font-black mb-1"
                        style={{ textShadow: "0 0 10px rgba(255,215,0,0.3)" }}>
                        {winners[0].nickname}
                      </div>

                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                        className="font-mono text-2xl font-black text-[#34D399] mb-1"
                        style={{ textShadow: "0 0 12px rgba(52,211,153,0.3)" }}
                      >
                        +₮{(winners[0].amount / 100).toLocaleString()}
                      </motion.div>

                      {winners[0].handResult?.description && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-xs text-[#8899AB] px-3 py-1 rounded-full inline-block"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          {winners[0].handResult.description}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 착석 안 했으면 안내 */}
        {!seated && serverPlayers.length === 0 && (
          <div className="absolute inset-0 z-20 flex justify-center" style={{ paddingTop: "62%" }}>
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowBuyInModal(true)}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white h-fit"
              style={{
                background: "linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,53,0.08))",
                border: "1px solid rgba(255,107,53,0.2)",
                boxShadow: "0 0 15px rgba(255,107,53,0.1)",
                backdropFilter: "blur(4px)",
              }}>
              Take a Seat
            </motion.button>
          </div>
        )}
      </div>

      {/* ====== ACTION PANEL — mobile-optimized ====== */}
      <div className="shrink-0 z-30 action-panel safe-bottom"
        style={{ background: "rgba(5,8,12,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="px-3 sm:px-4 pt-2 pb-2 max-w-lg mx-auto">

          {isMyTurn ? (
            <>
              {/* Timer bar */}
              <motion.div className="h-1 rounded-full mb-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }}
                  transition={{ duration: (turnInfo?.timeoutMs ?? 30000) / 1000, ease: "linear" }}
                  className="h-full" style={{ background: "linear-gradient(90deg, #34D399, #E5B800, #EF4444)" }} />
              </motion.div>

              {/* Raise slider — larger touch target */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 py-1">
                  <Slider value={[raiseAmount]} onValueChange={(v) => setRaiseAmount(v[0]!)}
                    min={minRaise} max={maxRaise} step={Math.max(1, Math.floor((maxRaise - minRaise) / 100))}
                    className="[&_[data-slot=slider-thumb]]:w-6 [&_[data-slot=slider-thumb]]:h-6" />
                </div>
                <div className="shrink-0 px-3 py-1.5 rounded-lg min-w-[70px] text-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs font-mono font-black text-white">₮{(raiseAmount/100).toLocaleString()}</span>
                </div>
              </div>

              {/* Presets — larger touch targets */}
              <div className="flex gap-1.5 mb-3">
                {[
                  { l: "MIN", v: minRaise },
                  { l: "⅓", v: Math.floor(pot / 3) + callAmount },
                  { l: "½", v: Math.floor(pot / 2) + callAmount },
                  { l: "POT", v: pot + callAmount },
                  { l: "ALL IN", v: maxRaise },
                ].map((p) => {
                  const clamped = Math.max(minRaise, Math.min(maxRaise, p.v));
                  const isAllIn = p.l === "ALL IN";
                  const isSelected = raiseAmount === clamped;
                  return (
                    <button key={p.l} onClick={() => { setRaiseAmount(clamped); playSound('click'); }}
                      className="flex-1 py-2 text-[10px] sm:text-[11px] font-bold tracking-wider rounded-lg transition-all touch-target"
                      style={{
                        background: isSelected ? (isAllIn ? "rgba(229,184,0,0.15)" : "rgba(52,211,153,0.1)")
                          : (isAllIn ? "rgba(229,184,0,0.05)" : "rgba(255,255,255,0.02)"),
                        color: isSelected ? (isAllIn ? "#FFD700" : "#34D399") : (isAllIn ? "#E5B800" : "#3D4F65"),
                        border: isSelected ? `1px solid ${isAllIn ? "rgba(229,184,0,0.3)" : "rgba(52,211,153,0.2)"}` : "1px solid rgba(255,255,255,0.04)",
                      }}>{p.l}</button>
                  );
                })}
              </div>

              {/* Action buttons — large, touch-friendly */}
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.93 }} onClick={() => { handleFold(); playSound('click'); }}
                  className="flex-1 py-3.5 sm:py-4 rounded-xl action-btn active:brightness-110"
                  style={{ background: "linear-gradient(180deg, #C62828 0%, #B71C1C 100%)", boxShadow: "0 4px 12px rgba(198,40,40,0.25)" }}>
                  <span className="text-white text-[13px] sm:text-[14px] font-bold uppercase tracking-wider">Fold</span>
                </motion.button>

                <motion.button whileTap={{ scale: 0.93 }} onClick={() => { (canCheck ? handleCheck : handleCall)(); playSound('click'); }}
                  className="flex-[1.4] py-3.5 sm:py-4 rounded-xl action-btn active:brightness-110"
                  style={{ background: "linear-gradient(180deg, #2E7D32 0%, #1B5E20 100%)", boxShadow: "0 4px 12px rgba(46,125,50,0.25)" }}>
                  <div className="flex flex-col items-center">
                    <span className="text-white text-[13px] sm:text-[14px] font-bold uppercase tracking-wider">{canCheck ? "Check" : "Call"}</span>
                    {!canCheck && <span className="text-white/60 text-[10px] font-mono">₮{(callAmount/100).toLocaleString()}</span>}
                  </div>
                </motion.button>

                <motion.button whileTap={{ scale: 0.93 }}
                  onClick={() => { (raiseAmount >= maxRaise ? handleAllIn : handleRaise)(); playSound('click'); }}
                  className="flex-1 py-3.5 sm:py-4 rounded-xl action-btn active:brightness-110"
                  style={{
                    background: raiseAmount >= maxRaise
                      ? "linear-gradient(180deg, #B8860B 0%, #8B6914 100%)"
                      : "linear-gradient(180deg, #1565C0 0%, #0D47A1 100%)",
                    boxShadow: raiseAmount >= maxRaise
                      ? "0 4px 12px rgba(184,134,11,0.25)"
                      : "0 4px 12px rgba(21,101,192,0.25)",
                  }}>
                  <div className="flex flex-col items-center">
                    <span className="text-white text-[13px] sm:text-[14px] font-bold uppercase tracking-wider">
                      {raiseAmount >= maxRaise ? "All In" : "Raise"}
                    </span>
                    <span className="text-white/60 text-[10px] font-mono">₮{(raiseAmount/100).toLocaleString()}</span>
                  </div>
                </motion.button>
              </div>
            </>
          ) : seated && phase !== "WAITING" && phase !== "RESULT" ? (
            /* Pre-action buttons — select action before your turn */
            <div className="py-3">
              <div className="text-[9px] text-[#2A3650] text-center mb-2 uppercase tracking-wider">Pre-select action</div>
              <div className="flex gap-2 justify-center">
                {[
                  { label: "Fold", action: 0, color: "#C62828", bg: "rgba(198,40,40,0.08)" },
                  { label: "Check/Fold", action: 1, color: "#4A5A70", bg: "rgba(255,255,255,0.02)" },
                  { label: "Call Any", action: 2, color: "#2E7D32", bg: "rgba(46,125,50,0.08)" },
                ].map(pre => (
                  <button key={pre.label}
                    onClick={() => { send({ type: 'SET_PRE_ACTION', action: pre.action as any }); toast.success(`Pre-action: ${pre.label}`); }}
                    className="px-4 py-2 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
                    style={{ background: pre.bg, color: pre.color, border: `1px solid ${pre.color}22` }}>
                    {pre.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <span className="text-xs text-[#3D4F65]">
                {phase === "WAITING" ? "Waiting for players..." : phase === "RESULT" ? "Next hand starting..." : "Waiting for action..."}
              </span>
            </div>
          )}
        </div>
      </div>

      <ChatPanel open={showChat} onOpenChange={setShowChat} />
      <BuyInModal open={showBuyInModal} onOpenChange={setShowBuyInModal}
        minBuyIn={2000} maxBuyIn={10000} currentBalance={12450.50}
        tableName="NL Hold'em" blinds="50/100" onJoinTable={handleBuyIn} />
    </div>
  );
}
