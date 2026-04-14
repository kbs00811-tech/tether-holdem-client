import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, MessageSquare, Volume2, VolumeX, Zap, Users, MoreVertical, Shield, X, Plus } from "lucide-react";
import { Slider } from "../components/ui/slider";
import { PlayerSlot } from "../components/PlayerSlot";
import { PokerCard } from "../components/PokerCard";
import { CardSqueeze } from "../components/CardSqueeze";
import { PokerChip, getChipColorByValue } from "../components/PokerChip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { ChatPanel } from "../components/ChatPanel";
import { BuyInModal } from "../components/BuyInModal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "../stores/gameStore";
import { useSocket } from "../hooks/useSocket";
import { playSound, setMuted as setSoundMuted, isMuted as isSoundMuted, startBGM, stopBGM, setBGMVolume } from "../hooks/useSound";
import { useSettingsStore, TABLE_FELTS } from "../stores/settingsStore";
import { useEmbedMode } from "../hooks/useEmbedMode";
import { formatMoney, getSymbol } from "../utils/currency";

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
    shownCards, rabbitCards, handHistoryRecords,
    showMuckPrompt, insuranceOffer, cashOutOffer, isSittingOut, isDealing,
  } = useGameStore();
  const emptySeats = useGameStore(s => s.emptySeats);
  const runItBoards = useGameStore(s => s.runItBoards);
  const lastActions = useGameStore(s => s.lastActions);
  const allInBanner = useGameStore(s => s.allInBanner);
  const dramaticMoment = useGameStore(s => s.dramaticMoment);
  const currentAvatarIdx = useSettingsStore(s => s.avatar);
  const { user: embedUser } = useEmbedMode();
  const realBalance = embedUser?.balance ?? 0;
  const myPlayerIdReactive = useGameStore(s => s.myPlayerId);

  const [raiseAmount, setRaiseAmount] = useState(400);
  const [showChat, setShowChat] = useState(false);
  const [floatingEmoji, setFloatingEmoji] = useState<{ emoji: string; seat: number; key: number } | null>(null);
  const [showBuyInModal, setShowBuyInModal] = useState(false);
  const [isMuted, setIsMuted] = useState(isSoundMuted());
  const [showVolume, setShowVolume] = useState(false);
  const [volume, setVolume] = useState(50); // 0-100
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showHandHistory, setShowHandHistory] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [seated, setSeated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iosFullscreenMode, setIosFullscreenMode] = useState(false);
  const [leaveReserved, setLeaveReserved] = useState(false); // 나가기 예약 (핸드 끝나면 나감)
  // 신규 기능 state
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showChangeSeatModal, setShowChangeSeatModal] = useState(false);
  const [showPreActionPanel, setShowPreActionPanel] = useState(false);
  const [runItMode, setRunItMode] = useState<'off' | 'twice' | 'thrice'>('off');
  const [waitForBB, setWaitForBB] = useState(false);
  const [preAction, setPreAction] = useState<'fold' | 'check_fold' | 'check' | 'call_any' | null>(null);

  // iOS Safari 감지
  const isIOS = typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // 전체화면 토글 (크로스 플랫폼)
  const toggleFullscreen = useCallback(async () => {
    const doc = document as any;
    const el = document.documentElement as any;
    const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement;

    try {
      if (!fsElement) {
        // iOS Safari: Fullscreen API 없음 → CSS 기반 대응
        if (isIOS) {
          setIosFullscreenMode(true);
          window.scrollTo(0, 1);
          // iframe 내부면 부모에 알림 (CSS 모드 유지)
          if (window.self !== window.top) {
            window.parent?.postMessage({ type: 'REQUEST_FULLSCREEN' }, '*');
          }
          return;
        }
        // ★ iframe 내부라도 직접 requestFullscreen 호출 가능 (allow="fullscreen" 권한)
        //   user gesture 컨텍스트 유지 — postMessage 경유 시 gesture 손실로 실패함
        if (el.requestFullscreen) {
          await el.requestFullscreen({ navigationUI: 'hide' });
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          el.mozRequestFullScreen();
        } else if (window.self !== window.top) {
          // 폴백: 부모에게 요청 (브라우저가 fullscreen API 미지원할 때만)
          window.parent?.postMessage({ type: 'REQUEST_FULLSCREEN' }, '*');
          setIosFullscreenMode(true);
        }
      } else {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
        setIosFullscreenMode(false);
      }
    } catch (e) {
      console.warn('[Fullscreen] error:', e);
    }
  }, [isIOS]);

  // 전체화면 상태 감지 (webkit/moz prefix 포함)
  useEffect(() => {
    const handler = () => {
      const doc = document as any;
      const fs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement);
      setIsFullscreen(fs || iosFullscreenMode);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    document.addEventListener('mozfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
      document.removeEventListener('mozfullscreenchange', handler);
    };
  }, [iosFullscreenMode]);

  // ─── Screen Wake Lock — 착석 중 화면 꺼짐 방지 ───
  // iOS Safari 16.4+ / Android Chrome / Desktop Chrome 지원
  useEffect(() => {
    if (!seated) return;
    let wakeLock: any = null;
    let released = false;

    const request = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('[WakeLock] acquired');
          wakeLock.addEventListener('release', () => {
            console.log('[WakeLock] released by system');
          });
        }
      } catch (e) {
        console.warn('[WakeLock] request failed:', e);
      }
    };

    request();

    // 페이지 visible 상태로 돌아올 때 재요청 (iOS 등에서 필요)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !released) request();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (wakeLock) { try { wakeLock.release(); } catch {} }
    };
  }, [seated]);

  // ─── 전화/앱 전환 감지 — 모바일에서 장시간 백그라운드 시 자동 나가기 ───
  // 30초 이상 페이지가 숨겨지면 SIT_OUT 처리, 5분 이상이면 자동 나가기
  useEffect(() => {
    if (!seated) return;
    let hiddenAt: number | null = null;
    let sitOutTimer: ReturnType<typeof setTimeout> | null = null;
    let leaveTimer: ReturnType<typeof setTimeout> | null = null;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        // 30초 후 자동 sit out (이미 sit out이면 무시)
        sitOutTimer = setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            send({ type: 'SIT_OUT' });
            useGameStore.setState({ isSittingOut: true });
            toast('백그라운드 감지 — 자동 Sit Out', { icon: '⏸️' });
          }
        }, 30000);
        // 5분 후 완전 나가기
        leaveTimer = setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            send({ type: 'STAND_UP' });
            send({ type: 'LEAVE_ROOM' });
          }
        }, 5 * 60 * 1000);
      } else {
        // 돌아왔음 — 타이머 취소
        if (sitOutTimer) clearTimeout(sitOutTimer);
        if (leaveTimer) clearTimeout(leaveTimer);
        const awayMs = hiddenAt ? Date.now() - hiddenAt : 0;
        if (awayMs > 30000) {
          toast.success(`${Math.round(awayMs/1000)}초 자리비움 후 복귀`);
        }
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (sitOutTimer) clearTimeout(sitOutTimer);
      if (leaveTimer) clearTimeout(leaveTimer);
    };
  }, [seated, send]);

  // ─── 나가기 예약 — HAND_RESULT 이벤트 도착 시 자동 STAND_UP + LEAVE_ROOM ───
  // 이전 버그: phase 변화로 감지했으나 RESULT가 너무 빨리 지나가 놓치는 경우 다수.
  // 수정: handHistoryRecords 카운트로 신뢰성 있게 핸드 종료 감지.
  const handHistoryCount = useGameStore(s => s.handHistoryRecords.length);
  const reservedLeavePhase = useGameStore(s => s.gameState?.phase);
  const reserveBaselineRef = useRef<number>(-1);

  // leaveReserved=true 가 되는 순간 baseline 저장
  useEffect(() => {
    if (leaveReserved && reserveBaselineRef.current < 0) {
      reserveBaselineRef.current = handHistoryCount;
    }
    if (!leaveReserved) {
      reserveBaselineRef.current = -1;
    }
  }, [leaveReserved, handHistoryCount]);

  useEffect(() => {
    if (!leaveReserved) return;
    const baseline = reserveBaselineRef.current;
    // 1) 이미 좌석 없으면 즉시 나감
    // 2) 새 HAND_RESULT 1개 이상 받음 (핸드 종료)
    // 3) 페이즈가 WAITING/READY/RESULT (안전망)
    const handFinished = baseline >= 0 && handHistoryCount > baseline;
    const safePhase = reservedLeavePhase === 'WAITING' || reservedLeavePhase === 'READY' || reservedLeavePhase === 'RESULT';
    if (!seated || handFinished || safePhase) {
      send({ type: 'STAND_UP' });
      setTimeout(() => { try { send({ type: 'LEAVE_ROOM' }); } catch {} }, 100);
      setLeaveReserved(false);
      reserveBaselineRef.current = -1;
      toast.success('게임 종료 후 자동 퇴장');
      setTimeout(() => navigate('/'), 300);
    }
  }, [leaveReserved, handHistoryCount, reservedLeavePhase, seated, send, navigate]);

  // 게임 진입 시 자동 전체화면 — 모든 기기
  // 브라우저 보안: requestFullscreen 은 user gesture 필수.
  //   (1) 진입 직후 silent 시도 (대부분 실패하지만 iframe parent 유도)
  //   (2) 첫 사용자 입력에서 무조건 재시도 (silent 실패와 무관)
  useEffect(() => {
    const checkAlready = (): boolean => {
      const doc = document as any;
      const fs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement);
      return fs || iosFullscreenMode;
    };

    // 1. silent 시도 (iframe → postMessage 경로)
    const immediate = setTimeout(() => {
      if (!checkAlready()) toggleFullscreen();
    }, 300);

    // 2. 첫 사용자 상호작용 → 다시 시도 (브라우저 gesture 요구사항 충족)
    const onInteraction = () => {
      if (!checkAlready()) toggleFullscreen();
      cleanup();
    };
    const cleanup = () => {
      document.removeEventListener('click', onInteraction);
      document.removeEventListener('touchstart', onInteraction);
      document.removeEventListener('keydown', onInteraction);
    };
    document.addEventListener('click', onInteraction);
    document.addEventListener('touchstart', onInteraction);
    document.addEventListener('keydown', onInteraction);

    return () => {
      clearTimeout(immediate);
      cleanup();
    };
  }, [toggleFullscreen, iosFullscreenMode]);

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
        // ★ URL의 tableId와 정확히 매칭되는 방만 입장 (fallback 제거)
        const target = currentRooms.find(r => r.id === tableId);
        if (target) {
          console.log(`[GAME] Joining room: ${target.id} (${target.name})`);
          send({ type: 'JOIN_ROOM', roomId: target.id, buyIn: 0 });
          setJoinAttempted(true);
        } else {
          console.warn(`[GAME] Room ${tableId} not found in rooms list — staying in lobby view`);
          toast.error('Room not found');
        }
        clearInterval(timer);
      } else if (attempts > 10) {
        console.warn('[GAME] No rooms after 5s, giving up');
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [connected]);

  // ★ 자동 착석 제거 — 유저가 빈 자리 직접 클릭해서 앉아야 함 (관전 모드 진입 가능)
  // 이전: 입장 후 자동으로 빈 자리에 앉아서 의도치 않은 게임 시작
  // 현재: 입장만 하고 관전 모드, 사용자가 자리 클릭 시 BuyInModal 열림

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
  const maxSeats = 9;

  // 로컬 플레이어 (서버 응답 전 즉시 표시용)
  const [localPlayers, setLocalPlayers] = useState<Record<number, any>>({});

  // 플레이어 매핑: 서버 데이터 우선, 없으면 로컬 데이터
  const serverPlayers = gameState?.players ?? [];
  const players: (any | undefined)[] = Array.from({ length: maxSeats }, (_, i) => {
    // 서버 플레이어 우선
    const p = serverPlayers.find(sp => sp.seat === i);
    if (p) {
      // ★ Hero 자리 매칭 — myPlayerId만 신뢰. handCards 폴백 제거 (server sanitize로 항상 빈 배열)
      const isMySeat = !!(myPlayerIdReactive && p.id === myPlayerIdReactive);
      const avatarToUse = isMySeat ? currentAvatarIdx : (p.avatarId ?? i);
      return {
        name: p.nickname,
        stack: p.stack / 100,
        bet: p.currentBet / 100,
        avatar: avatarToUse,
        status: p.status === "ACTIVE" ? "active" : p.status === "FOLDED" ? "folded" :
          p.status === "ALL_IN" ? "allin" : p.status === "DISCONNECTED" ? "disconnected" :
          p.status === "SIT_OUT" ? "sitting-out" :
          p.status === "WAIT_BB" ? "wait-bb" : "waiting",
        isDealer: p.isDealer,
        isSmallBlind: p.isSB,
        isBigBlind: p.isBB,
        cards: undefined,
        hudStats: (p as any).hudStats,
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
  // ★ Hero seat 감지 — myPlayerId 가 일치하는 경우만. 모를 때는 -1 (hero 없음).
  //   이전 버그: -1일 때 중앙 좌석을 hero로 폴백하여 봇에 YOU 배지가 씌워짐.
  const heroByPid = myPlayerIdReactive
    ? serverPlayers.findIndex(p => p.id === myPlayerIdReactive)
    : -1;
  const heroSeat = heroByPid >= 0 ? serverPlayers[heroByPid]!.seat : -1;
  if (heroSeat >= 0 && players[heroSeat] && myHoleCards.length > 0) {
    players[heroSeat].cards = myHoleCards;
  }
  // ★ 내 서버 상태 — WAIT_BB 인지 판단
  const myServerStatus = heroByPid >= 0 ? serverPlayers[heroByPid]!.status : null;
  const isWaitingForBB = myServerStatus === "WAIT_BB";

  const myStack = heroSeat >= 0 ? (serverPlayers.find(p => p.seat === heroSeat)?.stack ?? 0) : 0;

  // ★ seated 상태 = 서버에 내가 있는지 (heroSeat >= 0). 자동 동기화 — 수동 setSeated 의존성 제거
  useEffect(() => {
    const isSeated = heroSeat >= 0;
    if (isSeated !== seated) setSeated(isSeated);
    // 서버에 내가 있으면 로컬 플레이어는 더 이상 필요 없음
    if (isSeated) setLocalPlayers({});
  }, [heroSeat, seated]);

  // ★ 서버 에러 처리 — 에러 코드별 분기
  const lastError = useGameStore(s => s.lastError);
  useEffect(() => {
    if (!lastError) return;
    // SIT_DOWN 실패 계열 — 착석 롤백
    if (['SIT_FAILED', 'DEDUCT_FAILED'].includes(lastError.code)) {
      setLocalPlayers({});
      setSeated(false);
      toast.error(lastError.message || lastError.code);
    } else if (lastError.code === 'INSUFFICIENT_BALANCE') {
      // 버그 #2: B2C 지갑 잔액 부족 — 착석/top-up 구분 안 되므로 메시지로 안내
      setLocalPlayers({});
      setSeated(false);
      toast.error('💸 지갑 잔액이 부족합니다. PeerX 지갑에서 충전하세요.', { duration: 4000 });
    } else if (lastError.code === 'TOPUP_FAILED') {
      // 버그 #2: 핸드 진행 중이거나 최대 스택 초과 — 착석 상태 유지
      toast.error('⏱️ 핸드 종료 후 다시 시도하세요 (또는 최대 스택 초과)', { duration: 3500 });
    } else if (lastError.code === 'INVALID_AMOUNT') {
      toast.error('잘못된 금액입니다');
    } else if (lastError.code === 'RECONNECTED') {
      toast.success(lastError.message, { duration: 5000, icon: '🔄' });
    }
  }, [lastError]);
  const canCheck = !turnInfo || turnInfo.callAmount <= 0;
  const callAmount = turnInfo?.callAmount ?? 0;
  const minRaise = turnInfo?.minBet ?? (currentBet * 2 || 400);
  const maxRaise = turnInfo?.maxBet ?? myStack;
  const sbAmount = gameState?.smallBlind ? (gameState.smallBlind / 100).toLocaleString() : "—";
  const bbAmount = gameState?.bigBlind ? (gameState.bigBlind / 100).toLocaleString() : "—";
  const blinds = gameState?.smallBlind ? `${sbAmount}/${bbAmount}` : "—";

  // 베팅 액션
  // 칩 날아가는 애니메이션 트리거
  const [flyingChips, setFlyingChips] = useState<Array<{ fromSeat: number; action: string; amount: number; key: number }>>([]);
  // 승리 시 칩이 승자에게 날아가는 애니메이션
  const [winChips, setWinChips] = useState<Array<{ toSeat: number; amount: number; key: number }>>([]);
  // 팟 중앙 칩 스택 (누적) — POT 뱃지 위쪽(36%/42%)에 쌓임
  const [potChipStacks, setPotChipStacks] = useState<Array<{ color: string; x: number; y: number; rot: number }>>([]);

  const triggerChipFly = useCallback((fromSeat: number, action: string, amount: number) => {
    const chip = { fromSeat, action, amount, key: Date.now() + Math.random() };
    setFlyingChips(prev => [...prev, chip]);
    // 칩 도착 후 팟 중앙에 누적 (flyingChips 와 동일한 개수/위치)
    setTimeout(() => {
      const chipCount = action === 'allin' ? 5 : action === 'raise' ? 3 : 2;
      const chipColors = ['#26A17B', '#E5B800', '#8B5CF6', '#FF6B35', '#EF4444', '#34D399'];
      const newStacks = Array.from({ length: chipCount }, (_, i) => ({
        color: chipColors[(potChipStacks.length + i) % chipColors.length],
        x: (Math.random() - 0.5) * 24,
        y: (Math.random() - 0.5) * 10 - i * 1.5,
        rot: Math.random() * 360,
      }));
      setPotChipStacks(prev => [...prev, ...newStacks].slice(-20));
    }, 700);
    setTimeout(() => setFlyingChips(prev => prev.filter(c => c.key !== chip.key)), 900);
  }, [potChipStacks.length]);

  // 승리 시 칩 수거 애니메이션
  useEffect(() => {
    if (showResult && winners && winners[0]) {
      const winnerSeat = serverPlayers.find(p => p.id === winners[0].playerId)?.seat ?? heroSeat;
      setTimeout(() => {
        setWinChips([{ toSeat: winnerSeat, amount: winners[0].amount, key: Date.now() }]);
        playSound('win');
      }, 800);
      // 칩 도착 후 정리
      setTimeout(() => {
        setWinChips([]);
        setPotChipStacks([]);
      }, 2200);
    }
  }, [showResult, winners]);

  // 새 핸드 시작 시 팟 칩 리셋
  useEffect(() => {
    if (phase === "PREFLOP" || phase === "WAITING") {
      setPotChipStacks([]);
    }
  }, [phase]);

  // 다른 유저 액션 → 칩 플라이 애니메이션 트리거
  useEffect(() => {
    useGameStore.setState({
      onExternalPlayerAction: (seat, action, amount) => {
        if (action === 2 || action === 3 || action === 4) {
          const tag = action === 4 ? 'allin' : action === 3 ? 'raise' : 'call';
          triggerChipFly(seat, tag, amount);
        }
      },
    });
    return () => {
      useGameStore.setState({ onExternalPlayerAction: null });
    };
  }, [triggerChipFly]);

  // myCards가 새로 오면 딜링 비행 강제 트리거
  const [forceDealAnim, setForceDealAnim] = useState(0);
  useEffect(() => {
    if (myCards.length >= 2) {
      const now = Date.now();
      setForceDealAnim(now);
      playSound('cardDeal');
      // 카드 2바퀴 (9-max 기준): 9×0.04 + 0.15 + 9×0.04 + 0.35 = 1.22s + 여유 = 1.8초
      setTimeout(() => setForceDealAnim(prev => prev === now ? 0 : prev), 1800);
    }
  }, [myCards.length > 0 ? `${myCards[0]?.suit}-${myCards[0]?.rank}-${myCards[1]?.suit}-${myCards[1]?.rank}` : '']);

  const handleFold = useCallback(() => {
    send({ type: 'BET', action: 0 });
    playSound('fold');
  }, [send]);

  const handleCheck = useCallback(() => {
    send({ type: 'BET', action: 1 });
    playSound('check');
  }, [send]);

  const handleCall = useCallback(() => {
    send({ type: 'BET', action: 2 });
    playSound('chipBet');
    triggerChipFly(heroSeat, 'call', callAmount);
  }, [send, callAmount, heroSeat, triggerChipFly]);

  const handleRaise = useCallback(() => {
    send({ type: 'BET', action: 3, amount: raiseAmount });
    playSound('chipsRaise');
    triggerChipFly(heroSeat, 'raise', raiseAmount);
  }, [send, raiseAmount, heroSeat, triggerChipFly]);

  const handleAllIn = useCallback(() => {
    send({ type: 'BET', action: 4 });
    playSound('allIn');
    triggerChipFly(heroSeat, 'allin', myStack);
  }, [send, myStack, heroSeat, triggerChipFly]);

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
    // ★ setSeated 는 useEffect로 자동 — 서버 PLAYER_JOINED 도착 시 heroSeat 갱신되며 동기화
    setShowBuyInModal(false);
    toast.success(`Bought in for ${getSymbol()}${amount.toLocaleString()}`);
  }, [send, clickedSeat, serverPlayers, maxSeats, currentRoomId]);

  const handleLeave = useCallback(() => {
    if (seated) {
      setShowLeaveConfirm(true); // 착석 중이면 확인 모달
    } else {
      send({ type: 'LEAVE_ROOM' });
      navigate('/');
    }
  }, [send, navigate, seated]);

  const confirmLeave = useCallback(() => {
    send({ type: 'STAND_UP' });
    send({ type: 'LEAVE_ROOM' });
    setShowLeaveConfirm(false);
    navigate('/');
  }, [send, navigate]);

  // ★ 강제 나가기 — 전역 핸들러 (PlayerSlot 메뉴에서 호출)
  const forceLeave = useCallback(() => {
    try { send({ type: 'STAND_UP' }); } catch {}
    setTimeout(() => { try { send({ type: 'LEAVE_ROOM' }); } catch {}; navigate('/'); }, 200);
  }, [send, navigate]);
  useEffect(() => {
    (window as any).__forceLeave = forceLeave;
    return () => { delete (window as any).__forceLeave; };
  }, [forceLeave]);

  // ★ Stuck 감지 — 60초 동안 페이즈 변화/액션 없음 → 강제 나가기 배너
  const lastActivityRef = useRef<number>(Date.now());
  const [showStuckBanner, setShowStuckBanner] = useState(false);
  useEffect(() => {
    // 페이즈/팟/턴 변경이 있으면 활동 기록
    lastActivityRef.current = Date.now();
    setShowStuckBanner(false);
  }, [phase, pot, isMyTurn]);
  useEffect(() => {
    if (!seated) { setShowStuckBanner(false); return; }
    const iv = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs > 60000) setShowStuckBanner(true);
    }, 5000);
    return () => clearInterval(iv);
  }, [seated]);

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
  // ===== HERO-CENTRIC LAYOUT =====
  // 모든 레이아웃은 index 0 = hero(하단 중앙), 시계방향 순서.
  // 서버 seat i 는 아래 seatPositionsData 계산식에서 heroSeat 기준 회전돼
  // 실제 visual index (i - heroSeat + N) % N 으로 매핑된다.

  // 6-Max: 6 seats at 60° intervals, clockwise from hero (bottom)
  //             [3]           12 o'clock (top)
  //        [2]     [4]        10 / 2 o'clock
  //        [1]     [5]         8 / 4 o'clock
  //             [0]           6 o'clock (hero)
  const HERO_LAYOUT_6: [number, number][] = [
    [50,  92],    // 0: hero — bottom center
    [-5,  75],    // 1: bottom-left (hero's left → next cw)
    [-5,  22],    // 2: upper-left
    [50,  -5],    // 3: top center
    [105, 22],    // 4: upper-right
    [105, 75],    // 5: bottom-right
  ];

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const isLargeDesktop = typeof window !== 'undefined' && window.innerWidth >= 1280;

  // 9-Max: 9 seats at 40° intervals, clockwise from hero (bottom center)
  // Portrait (모바일): 세로형 — 양옆 여유 좁게, 상/하 여유는 유지
  const HERO_LAYOUT_9_PORTRAIT: [number, number][] = [
    [50,  92],    // 0: hero — bottom center
    [15,  90],    // 1: bottom-left
    [-8,  58],    // 2: left
    [0,   22],    // 3: upper-left
    [30,  0],     // 4: top-left
    [70,  0],     // 5: top-right
    [100, 22],    // 6: upper-right
    [108, 58],    // 7: right
    [85,  90],    // 8: bottom-right
  ];
  // Landscape (데스크탑): 가로형 — 양옆 넓게, 상하는 컴팩트
  const HERO_LAYOUT_9_LANDSCAPE: [number, number][] = [
    [50,  92],    // 0: hero — bottom center
    [10,  90],    // 1: bottom-left
    [-12, 60],    // 2: left
    [-6,  22],    // 3: upper-left
    [28,  -2],    // 4: top-left
    [72,  -2],    // 5: top-right
    [106, 22],    // 6: upper-right
    [114, 60],    // 7: right
    [92,  90],    // 8: bottom-right
  ];
  const HERO_LAYOUT_9 = isDesktop ? HERO_LAYOUT_9_LANDSCAPE : HERO_LAYOUT_9_PORTRAIT;

  // ===== 회전 매핑 =====
  // base 레이아웃(index 0 = hero 위치)을 heroSeat 기준으로 회전.
  // 서버 seat i → visual index (i - heroSeat + N) % N → base[d]
  // heroSeat < 0 (관전 중) 이면 base 그대로 반환.
  const baseLayout = maxSeats === 6 ? HERO_LAYOUT_6 : HERO_LAYOUT_9;
  const seatPositionsData: [number, number][] = heroSeat < 0
    ? baseLayout
    : Array.from({ length: maxSeats }, (_, i) => baseLayout[(i - heroSeat + maxSeats) % maxSeats]!);
  // No separate seatPositions/betChipPos objects needed here —
  // they'll be placed inside the rim div below

  return (
    <div className={`h-[100dvh] flex flex-col overflow-hidden select-none ${iosFullscreenMode ? 'fixed inset-0 z-[9999]' : ''}`}
      style={{ background: "radial-gradient(ellipse at 50% 40%, #0C1620 0%, #080E16 40%, #050A10 100%)" }}>

      {/* ====== TOP BAR — 모바일/데스크탑 반응형 ====== */}
      <div className="shrink-0 z-30 px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 flex items-center justify-between"
        style={{ background: "rgba(8,12,20,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button onClick={handleLeave} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-[#8899AB]" />
          </button>
          <div className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg"
            style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.15)" }}>
            <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-[#FF6B35]" />
            <span className="text-xs sm:text-sm md:text-base text-[#FF6B35] font-mono font-black">{blinds}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-[#6B7A90]" />
            <span className="text-[10px] sm:text-xs md:text-sm text-[#8899AB] font-mono font-bold">{playerCount}/{maxSeats}</span>
          </div>
          {handNumber > 0 && (
            <span className="text-[10px] sm:text-xs text-[#4A5A70] font-mono hidden sm:inline">#{handNumber}</span>
          )}
        </div>

        {/* Stage */}
        <div className="flex gap-0.5 sm:gap-1 rounded-lg p-1" style={{ background: "rgba(0,0,0,0.4)" }}>
          {["P","F","T","R"].map((l,i) => {
            const active = i <= getStageIndex();
            const current = i === getStageIndex();
            return (
              <div key={l} className="relative">
                <div className="w-6 h-5 sm:w-9 sm:h-7 md:w-10 md:h-8 flex items-center justify-center rounded text-[9px] sm:text-[11px] md:text-xs font-bold"
                  style={{ background: active ? "rgba(52,211,153,0.18)" : "transparent", color: active ? "#34D399" : "#2A3545" }}>{l}</div>
                {current && <motion.div className="absolute -bottom-0.5 left-1/2 w-1.5 h-0.5 rounded-full"
                  style={{ background: "#34D399", transform: "translateX(-50%)" }} layoutId="stage-dot" />}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* ★ WATCHING 배지 — 관전 모드(미착석) 표시 */}
          {!seated && (
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-2 py-1 rounded-lg flex items-center gap-1.5"
              style={{
                background: "rgba(52,211,153,0.12)",
                border: "1px solid rgba(52,211,153,0.35)",
                boxShadow: "0 0 12px rgba(52,211,153,0.2)",
              }}>
              <span style={{ fontSize: 11 }}>👁</span>
              <span className="text-[10px] font-black tracking-wider" style={{ color: "#34D399", letterSpacing: "0.08em" }}>
                WATCHING
              </span>
            </motion.div>
          )}
          {/* Stack — 데스크탑만 */}
          {seated && (
            <div className="px-2 py-1 rounded-lg hidden md:flex items-center gap-1.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[10px] text-[#6B7A90]">Stack</span>
              <span className="text-xs font-mono font-black text-[#34D399]">
                {getSymbol()}{((serverPlayers.find(p => p.seat === heroSeat)?.stack ?? 0) / 100).toLocaleString()}
              </span>
            </div>
          )}
          {/* History — 데스크탑만 */}
          <button onClick={() => { send({ type: 'GET_HAND_HISTORY', limit: 10 }); setShowHandHistory(true); }}
            className="hidden sm:block px-2 py-1 rounded-lg text-[10px] font-semibold"
            style={{ background: "rgba(255,255,255,0.04)", color: "#6B7A90" }}>
            History
          </button>
          {/* Top Up — 헤더 우측 상단 (데스크탑만, 모바일은 베팅 영역 근처에 별도 표시) */}
          {seated && (
            <button onClick={() => {
                const inHand = phase !== "WAITING" && phase !== "RESULT";
                if (inHand) {
                  toast('⏱️ 현재 핸드 종료 후 충전 가능합니다', { duration: 2500, icon: '⏳' });
                }
                setShowTopUpModal(true);
              }}
              className="hidden md:block px-2 py-1 rounded-lg text-[10px] font-bold"
              style={{ background: "rgba(52,211,153,0.08)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
              +$ Top Up
            </button>
          )}
          {/* Change Seat — 데스크탑만 */}
          {seated && (
            <button onClick={() => {
                send({ type: 'GET_EMPTY_SEATS' });
                setShowChangeSeatModal(true);
              }}
              className="hidden sm:block px-2 py-1 rounded-lg text-[10px] font-semibold"
              style={{ background: "rgba(124,58,237,0.08)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.2)" }}>
              🪑 Seat
            </button>
          )}
          {/* Pre-Action */}
          {seated && (
            <button onClick={() => setShowPreActionPanel(v => !v)}
              className="hidden sm:block px-2 py-1 rounded-lg text-[10px] font-bold"
              style={{
                background: preAction ? "rgba(240,185,11,0.15)" : "rgba(255,255,255,0.04)",
                color: preAction ? "#F0B90B" : "#6B7A90",
                border: preAction ? "1px solid rgba(240,185,11,0.3)" : "1px solid transparent",
              }}>
              ⚡ Pre
            </button>
          )}
          {/* Wait for BB */}
          {seated && (
            <button onClick={() => {
                const next = !waitForBB;
                setWaitForBB(next);
                send({ type: 'WAIT_FOR_BB', enabled: next });
                toast.success(next ? 'Waiting for BB' : 'Wait for BB off');
              }}
              className="hidden md:block px-2 py-1 rounded-lg text-[10px] font-bold"
              style={{
                background: waitForBB ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.04)",
                color: waitForBB ? "#22D3EE" : "#6B7A90",
                border: waitForBB ? "1px solid rgba(34,211,238,0.25)" : "1px solid transparent",
              }}>
              ⏳ BB
            </button>
          )}
          {/* Run It Twice/Thrice */}
          {seated && (
            <button onClick={() => {
                const next: 'off' | 'twice' | 'thrice' =
                  runItMode === 'off' ? 'twice' :
                  runItMode === 'twice' ? 'thrice' : 'off';
                setRunItMode(next);
                send({ type: 'SET_RUN_IT_MODE', mode: next });
                toast.success(`Run It: ${next.toUpperCase()}`);
              }}
              className="hidden md:block px-2 py-1 rounded-lg text-[10px] font-bold"
              style={{
                background: runItMode !== 'off' ? "rgba(255,107,53,0.12)" : "rgba(255,255,255,0.04)",
                color: runItMode !== 'off' ? "#FF6B35" : "#6B7A90",
                border: runItMode !== 'off' ? "1px solid rgba(255,107,53,0.3)" : "1px solid transparent",
              }}
              title="Off → Twice → Thrice">
              🎲 {runItMode === 'off' ? 'RIT' : runItMode === 'twice' ? '2×' : '3×'}
            </button>
          )}
          {/* 전체화면 토글 */}
          <button onClick={toggleFullscreen}
            className="px-1.5 sm:px-2 py-1 rounded-lg text-xs"
            style={{ background: "rgba(255,255,255,0.04)" }}
            title={isFullscreen ? "전체화면 해제" : "전체화면"}>
            {isFullscreen ? "⤢" : "⛶"}
          </button>
          {/* Emoji */}
          <button onClick={() => setShowEmoji(!showEmoji)}
            className="px-1.5 sm:px-2 py-1 rounded-lg text-xs"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            😊
          </button>
          {/* Sit Out — 모바일 간소화 */}
          {seated && (
            <button onClick={() => {
              if (isSittingOut) {
                send({ type: 'SIT_IN' });
                useGameStore.setState({ isSittingOut: false });
                toast.success('Back in action');
              } else {
                send({ type: 'SIT_OUT' });
                useGameStore.setState({ isSittingOut: true });
                toast.success('Sitting out');
              }
            }}
              className="px-1.5 sm:px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-semibold"
              style={{
                background: isSittingOut ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
                color: isSittingOut ? "#EF4444" : "#6B7A90",
              }}>
              {isSittingOut ? "In" : "Out"}
            </button>
          )}
          <div className="relative">
            <button onClick={() => {
              const newMuted = !isMuted;
              setIsMuted(newMuted);
              setSoundMuted(newMuted);
              if (newMuted) stopBGM(); else startBGM();
              playSound('click');
            }}
              onContextMenu={(e) => { e.preventDefault(); setShowVolume(!showVolume); }}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: isMuted ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)" }}>
              {isMuted ? <VolumeX className="h-4 w-4 text-[#EF4444]" /> : <Volume2 className="h-4 w-4 text-[#4A5A70]" />}
            </button>
            {/* Volume slider popup */}
            <AnimatePresence>
              {showVolume && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-12 right-0 z-50 p-3 rounded-xl w-48"
                  style={{ background: "rgba(20,24,32,0.95)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
                  <div className="text-[10px] text-[#6B7A90] mb-2 uppercase tracking-wider">Volume</div>
                  <div className="flex items-center gap-2 mb-3">
                    <VolumeX className="h-3 w-3 text-[#3D4F65]" />
                    <input type="range" min={0} max={100} value={volume}
                      onChange={e => {
                        const v = Number(e.target.value);
                        setVolume(v);
                        setBGMVolume(v / 100 * 0.3);
                        if (v === 0) { setIsMuted(true); setSoundMuted(true); }
                        else { setIsMuted(false); setSoundMuted(false); }
                      }}
                      className="flex-1 h-1.5 rounded-full appearance-none bg-[#1A2235]
                        [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF6B35]
                        [&::-webkit-slider-thumb]:appearance-none" />
                    <Volume2 className="h-3 w-3 text-[#6B7A90]" />
                  </div>
                  <div className="text-center text-xs text-[#4A5A70] font-mono">{volume}%</div>
                  <button onClick={() => setShowVolume(false)}
                    className="w-full mt-2 py-1.5 rounded-lg text-[10px] text-[#6B7A90] bg-white/[0.03]">
                    Close
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ====== Bad Beat / Cooler 드라마틱 배너 ====== */}
      <AnimatePresence>
        {dramaticMoment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center"
            style={{
              background: dramaticMoment.type === 'bad_beat'
                ? "radial-gradient(ellipse at center, rgba(239,68,68,0.35) 0%, rgba(239,68,68,0.15) 40%, transparent 80%)"
                : "radial-gradient(ellipse at center, rgba(240,185,11,0.30) 0%, rgba(240,185,11,0.12) 40%, transparent 80%)",
            }}>
            <motion.div
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ duration: 0.8, repeat: 4 }}
              className="absolute inset-0"
              style={{
                background: dramaticMoment.type === 'bad_beat'
                  ? "rgba(239,68,68,0.2)"
                  : "rgba(240,185,11,0.15)",
              }}
            />
            <div className="relative z-10 text-center max-w-lg px-4">
              <motion.div
                initial={{ scale: 0.4, rotate: -10 }}
                animate={{ scale: [0.4, 1.3, 1.1], rotate: [-10, 3, 0] }}
                transition={{ duration: 0.6 }}
                style={{
                  fontSize: "clamp(44px, 12vw, 130px)",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  textShadow: dramaticMoment.type === 'bad_beat'
                    ? "0 0 40px rgba(239,68,68,0.9), 0 0 80px rgba(239,68,68,0.5), 0 6px 20px rgba(0,0,0,0.8)"
                    : "0 0 40px rgba(240,185,11,0.9), 0 0 80px rgba(240,185,11,0.5), 0 6px 20px rgba(0,0,0,0.8)",
                  letterSpacing: "-0.02em",
                  fontFamily: "'Space Grotesk', sans-serif",
                  WebkitTextStroke: dramaticMoment.type === 'bad_beat' ? "3px #EF4444" : "3px #F0B90B",
                }}>
                {dramaticMoment.type === 'bad_beat' ? '😱 BAD BEAT!' : '🧊 COOLER!'}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 bg-black/70 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-around gap-4">
                  <div className="flex-1">
                    <div className="text-[10px] text-[#F0B90B] uppercase tracking-wider mb-1 font-bold">Winner</div>
                    <div className="text-sm font-black text-white truncate">{dramaticMoment.winnerNickname}</div>
                    <div className="text-[11px] text-[#34D399] mt-0.5 font-mono">{dramaticMoment.winnerHand}</div>
                  </div>
                  <div className="text-2xl">⚡</div>
                  <div className="flex-1">
                    <div className="text-[10px] text-[#6B7A90] uppercase tracking-wider mb-1 font-bold">Lost</div>
                    <div className="text-sm font-black text-[#8899AB] truncate">{dramaticMoment.loserNickname}</div>
                    <div className="text-[11px] text-[#EF4444] mt-0.5 font-mono">{dramaticMoment.loserHand}</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== ALL-IN 풀스크린 배너 ====== */}
      <AnimatePresence>
        {allInBanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center"
            style={{
              background: "radial-gradient(ellipse at center, rgba(239,68,68,0.25) 0%, rgba(239,68,68,0.1) 40%, transparent 80%)",
            }}>
            {/* Red pulse overlay */}
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 0.6, repeat: 3 }}
              style={{ background: "rgba(239,68,68,0.15)" }}
            />
            {/* Big ALL IN text */}
            <motion.div
              initial={{ scale: 0.3, rotate: -15 }}
              animate={{ scale: [0.3, 1.3, 1.1, 1.2], rotate: [-15, 5, -2, 0] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                fontSize: "clamp(60px, 18vw, 180px)",
                fontWeight: 900,
                color: "#FFFFFF",
                textShadow: "0 0 40px rgba(239,68,68,0.9), 0 0 80px rgba(239,68,68,0.5), 0 6px 20px rgba(0,0,0,0.8)",
                letterSpacing: "-0.02em",
                fontFamily: "'Space Grotesk', sans-serif",
                WebkitTextStroke: "3px #EF4444",
              }}>
              ALL IN!
            </motion.div>
            {/* Nickname + amount */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute bottom-1/3 flex flex-col items-center gap-2">
              <div className="text-xl sm:text-3xl font-black text-white" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
                {allInBanner.nickname}
              </div>
              <div className="text-base sm:text-xl font-mono font-black text-[#FFD700]"
                style={{ textShadow: "0 0 20px rgba(255,215,0,0.6)" }}>
                {getSymbol()}{(allInBanner.amount / 100).toLocaleString()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 나가기 예약 배너 ====== */}
      {leaveReserved && seated && (
        <div className="shrink-0 z-20 px-3 py-1.5 flex items-center justify-between text-[11px] font-bold"
          style={{ background: "linear-gradient(90deg, rgba(240,185,11,0.15), rgba(240,185,11,0.05))", borderBottom: "1px solid rgba(240,185,11,0.3)", color: "#F0B90B" }}>
          <span>⏱️ 나가기 예약됨 — 이번 핸드 종료 후 자동 퇴장</span>
          <button onClick={() => { setLeaveReserved(false); toast.success('예약 취소됨'); }}
            className="px-2 py-0.5 rounded text-[10px] border border-[#F0B90B]/40">
            취소
          </button>
        </div>
      )}

      {/* ====== TABLE AREA ====== */}
      <div className="flex-1 relative overflow-visible">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[800px]"
            style={{ background: "radial-gradient(ellipse at 50% 25%, rgba(30,80,60,0.08) 0%, transparent 60%)" }} />
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-1 sm:px-4"
          style={{ perspective: "800px" }}>
          {/* Mobile: portrait 9:14, Desktop: landscape — 데스크탑 해상도별 확장 */}
          <div className={`relative w-full h-full
            ${isDesktop
              ? 'max-w-[1280px] xl:max-w-[1500px] 2xl:max-w-[1720px] max-h-[640px] lg:max-h-[720px] xl:max-h-[820px] 2xl:max-h-[900px]'
              : 'max-h-[560px]'
            }`}
            style={{
              // 모바일: viewport 기반 동적 너비 (min 92vw, max 380px)
              maxWidth: isDesktop ? undefined : "min(96vw, 380px)",
              aspectRatio: isDesktop ? "16/8.5" : "10/14",
              transform: isDesktop
                ? "rotateX(14deg) translateY(-1%)"
                : "rotateX(8deg) translateY(0%) scale(0.99)",
              transformOrigin: "center 60%",
              transformStyle: "preserve-3d",
          }}>

            {/* Table shadows + rim */}
            <div className="absolute inset-x-[8%] inset-y-[4%]" style={{ borderRadius: 160, boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 100px rgba(0,0,0,0.4)" }} />

            {/* Neon glow rim — vivid animated */}
            <motion.div
              className="absolute inset-x-[7.5%] inset-y-[3.5%]"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(38,161,123,0.25), 0 0 40px rgba(38,161,123,0.1), inset 0 0 20px rgba(38,161,123,0.08)",
                  "0 0 35px rgba(38,161,123,0.35), 0 0 70px rgba(38,161,123,0.15), inset 0 0 30px rgba(38,161,123,0.12)",
                  "0 0 25px rgba(255,107,53,0.25), 0 0 50px rgba(255,107,53,0.1), inset 0 0 20px rgba(255,107,53,0.08)",
                  "0 0 20px rgba(38,161,123,0.25), 0 0 40px rgba(38,161,123,0.1), inset 0 0 20px rgba(38,161,123,0.08)",
                ],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{
                borderRadius: 160,
                border: "2px solid rgba(38,161,123,0.18)",
              }}
            />

            {/* Dark rim body */}
            <div className="absolute inset-x-[8%] inset-y-[4%]" style={{ borderRadius: 160, background: "linear-gradient(180deg, #1E2A36 0%, #151E28 40%, #0E161E 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.3)", overflow: "visible" }}>
              {/* ===== PLAYERS — positioned relative to rim ===== */}
              {players.map((player, i) => (
                <div key={`seat-${i}`} style={{
                  position: "absolute",
                  left: `${seatPositionsData[i]![0]}%`,
                  top: `${seatPositionsData[i]![1]}%`,
                  transform: "translate(-50%,-50%)",
                  // 버그8 수정: 모든 시트가 중앙 UI(칩, 팟)보다 위에 오도록 z-index 보강
                  zIndex: i === heroSeat ? 45 : 30,
                }}>
                  <PlayerSlot position={i} player={player} isHero={i === heroSeat}
                    isCurrentTurn={gameState?.currentTurnSeat === i}
                    turnDeadline={gameState?.currentTurnSeat === i ? turnInfo?.deadline : undefined}
                    turnTotalMs={turnInfo?.timeoutMs ?? 30000}
                    recentAction={lastActions[i] ? { action: lastActions[i].action, amount: lastActions[i].amount } : null}
                    onSitDown={() => handleSitClick(i)}
                    onTopUp={() => setShowBuyInModal(true)}
                    onEmoji={() => setShowEmoji(true)}
                    onSitOut={() => {
                      if (isSittingOut) { send({ type: 'SIT_IN' }); useGameStore.setState({ isSittingOut: false }); }
                      else { send({ type: 'SIT_OUT' }); useGameStore.setState({ isSittingOut: true }); }
                    }}
                    />
                </div>
              ))}

              {/* ===== BET CHIPS — 플레이어 근처 미니 칩 + 금액 ===== */}
              {players.map((p, i) => {
                if (!p || p.bet <= 0) return null;
                const sx = seatPositionsData[i]![0];
                const sy = seatPositionsData[i]![1];
                const bx = 50 + (sx - 50) * 0.42;
                const by = 50 + (sy - 50) * 0.42;
                // p.bet 은 이미 GameTable 상단에서 /100 된 외부 KRW 값
                // 칩 개수는 BB 대비 비율로 결정 — 2~5개
                const bbExternal = (gameState?.bigBlind ?? 0) / 100;
                const betRatio = bbExternal > 0 ? p.bet / bbExternal : 1;
                const chipCount = Math.min(5, Math.max(2, Math.ceil(betRatio)));
                const chipColor = getChipColorByValue(p.bet);
                // ★ 작은 칩 사이즈
                const chipSize = isDesktop ? 22 : 12;
                const chipStackW = isDesktop ? 24 : 14;
                const chipStackH = isDesktop ? 30 : 16;
                const stackOffset = isDesktop ? 3 : 1.5;
                return (
                  <div key={`bet-${i}-${p.bet}`} className="z-10 flex flex-col items-center" style={{
                    position: "absolute", left: `${bx}%`, top: `${by}%`, transform: "translate(-50%,-50%)",
                  }}>
                    {/* 칩 스택 (작게) */}
                    <div className="relative" style={{ width: chipStackW, height: chipStackH }}>
                      {Array.from({ length: chipCount }).map((_, ci) => (
                        <motion.div key={ci}
                          initial={{ scale: 0, y: 15 }}
                          animate={{ scale: 1, y: -ci * stackOffset }}
                          transition={{ delay: ci * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                          style={{ position: "absolute", left: 0, top: isDesktop ? 6 : 3 }}
                        >
                          <PokerChip size={chipSize} color={chipColor} />
                        </motion.div>
                      ))}
                    </div>
                    {/* ★ 금액 라벨 — 칩 바로 아래 중앙 (사용자 요청) */}
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="whitespace-nowrap"
                      style={{ marginTop: isDesktop ? 4 : 2 }}>
                      <span className={`${isDesktop ? 'text-[10px]' : 'text-[8px]'} font-mono font-black px-1.5 py-0.5 rounded`}
                        style={{
                          color: "#FFD700",
                          textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                          background: "rgba(0,0,0,0.85)",
                          border: "1px solid rgba(255,215,0,0.3)",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                        }}>
                        {/* p.bet 은 이미 /100 완료 — 중복 나눗셈 제거 (버그: W5/W10 표기 오류) */}
                        ₩{Math.round(p.bet).toLocaleString()}
                      </span>
                    </motion.div>
                  </div>
                );
              })}
            </div>
            <div className="absolute inset-x-[9.5%] inset-y-[5%]" style={{ borderRadius: 160, background: "linear-gradient(180deg, #19232E 0%, #121A22 100%)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)" }} />

            {/* Neon pinstripe — vivid color shift */}
            <motion.div
              className="absolute inset-x-[10.5%] inset-y-[5.8%]"
              animate={{
                borderColor: [
                  "rgba(38,161,123,0.2)",
                  "rgba(38,161,123,0.35)",
                  "rgba(255,107,53,0.25)",
                  "rgba(255,215,0,0.2)",
                  "rgba(139,92,246,0.15)",
                  "rgba(38,161,123,0.2)",
                ],
                boxShadow: [
                  "0 0 8px rgba(38,161,123,0.08), inset 0 0 8px rgba(38,161,123,0.04)",
                  "0 0 15px rgba(38,161,123,0.12), inset 0 0 12px rgba(38,161,123,0.06)",
                  "0 0 10px rgba(255,107,53,0.08), inset 0 0 8px rgba(255,107,53,0.04)",
                  "0 0 12px rgba(255,215,0,0.06), inset 0 0 8px rgba(255,215,0,0.03)",
                  "0 0 10px rgba(139,92,246,0.06), inset 0 0 8px rgba(139,92,246,0.03)",
                  "0 0 8px rgba(38,161,123,0.08), inset 0 0 8px rgba(38,161,123,0.04)",
                ],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              style={{ borderRadius: 160, border: "1.5px solid rgba(38,161,123,0.2)" }}
            />

            {/* Felt — dynamic color from settings */}
            <div className="absolute inset-x-[11%] inset-y-[6.2%] overflow-hidden" style={{
              borderRadius: 160,
              background: TABLE_FELTS[useSettingsStore.getState().tableFelt as keyof typeof TABLE_FELTS]?.gradient ?? TABLE_FELTS[1].gradient,
              boxShadow: "inset 0 0 60px rgba(0,0,0,0.3), inset 0 -20px 40px rgba(0,0,0,0.12)",
            }}>
              <div className="absolute inset-x-[12%] inset-y-[10%]" style={{ borderRadius: 160, border: "1px solid rgba(255,255,255,0.03)" }} />
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

            {/* 딜링 애니메이션은 하단 forceDealAnim 한 벌만 사용 — 중복 제거 */}

            {/* ===== COMMUNITY CARDS — 상단으로 이동(22/24%) POT/chip 영역과 분리 ===== */}
            <div className="absolute left-1/2 -translate-x-1/2 z-10"
              style={{ top: isDesktop ? "22%" : "24%" }}>
              <div className="flex items-center justify-center" style={{ gap: isLargeDesktop ? 10 : isDesktop ? 6 : 3 }}>
                <AnimatePresence>
                  {communityCards.map((card, i) => (
                    <motion.div key={`comm-${card.suit}-${card.rank}-${i}`}
                      initial={{ rotateY: 180, opacity: 0, x: -120 + i * 12, y: -80, scale: 0.25 }}
                      animate={{ rotateY: 0, opacity: 1, x: 0, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5, y: -20 }}
                      transition={{
                        // 버그2 수정: 플랍(0~2)만 300ms 스태거, 턴(3)·리버(4)는 즉시 펼침
                        // 지속시간도 0.5 → 0.75 로 늘려 카드 뒤집히는 느낌 강화
                        delay: i < 3 ? i * 0.30 : 0,
                        duration: 0.75,
                        type: "spring",
                        stiffness: 120,
                        damping: 14,
                      }}
                      className="shrink-0">
                      <div className="relative">
                        <PokerCard suit={card.suit} rank={card.rank} size={isLargeDesktop ? "xl" : isDesktop ? "lg" : "sm"} />
                        <div className="absolute -bottom-1 left-1 right-1 h-2 rounded-full"
                          style={{ background: "rgba(0,0,0,0.3)", filter: "blur(3px)" }} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {/* Empty card slots */}
                {Array.from({ length: Math.max(0, 5 - communityCards.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="shrink-0" style={{
                    width: isLargeDesktop ? 112 : isDesktop ? 72 : 40,
                    height: isLargeDesktop ? 157 : isDesktop ? 101 : 56,
                    borderRadius: 6,
                    border: "1px dashed rgba(255,255,255,0.04)",
                    background: "rgba(255,255,255,0.01)",
                  }} />
                ))}
              </div>
            </div>

            {/* ===== POT — chip 영역과 통합(47/49%), z-20 으로 chip 위에 표시 ===== */}
            {pot > 0 && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 z-20"
                style={{ top: isDesktop ? "47%" : "49%" }}
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
                    {getSymbol()}{(pot / 100).toLocaleString()}
                  </motion.span>
                </motion.div>
              </motion.div>
            )}

            {/* ===== CHIP FLY ANIMATION — 착지점 POT과 동일(47/49%) z-30 위에 POT z-20 겹침 */}
            <AnimatePresence>
              {flyingChips.map(chip => {
                const seatPos = seatPositionsData[chip.fromSeat] ?? [50, 100];
                const chipCount = chip.action === 'allin' ? 5 : chip.action === 'raise' ? 3 : 2;
                const chipColor = getChipColorByValue(chip.amount);
                return Array.from({ length: chipCount }).map((_, ci) => (
                  <motion.div key={`fly-${chip.key}-${ci}`}
                    className="z-[15] pointer-events-none"
                    style={{ position: 'absolute', transform: 'translate(-50%, -50%)' }}
                    initial={{
                      left: `${seatPos[0]}%`,
                      top: `${seatPos[1]}%`,
                      scale: 0.3,
                      opacity: 1,
                    }}
                    animate={{
                      left: `${50 + (Math.random() - 0.5) * 6}%`,
                      top: `${(isDesktop ? 47 : 49) + (Math.random() - 0.5) * 3}%`,
                      scale: 1,
                      opacity: [1, 1, 0],
                      rotate: ci * 60,
                    }}
                    exit={{ opacity: 0, scale: 0.4 }}
                    transition={{
                      duration: 0.7 + ci * 0.04,
                      delay: ci * 0.05,
                      ease: [0.22, 0.68, 0.36, 1],
                      times: [0, 0.6, 1],
                    }}
                  >
                    <PokerChip size={isDesktop ? 22 : 16} color={chipColor} />
                  </motion.div>
                ));
              })}
            </AnimatePresence>

            {/* ===== 중앙 팟 칩 스택 — POT 뱃지와 동일 위치(47/49%) 뒤에 쌓임
                 z 순서: 칩스택[8] < flyingChips[15] < POT[20] < winChips[40] */}
            {potChipStacks.length > 0 && (
              <div className="absolute z-[8] pointer-events-none"
                style={{
                  left: '50%',
                  top: isDesktop ? '47%' : '49%',
                  width: 0, height: 0,
                }}>
                {potChipStacks.map((chip, i) => {
                  const colorMap: Record<string, string> = {
                    '#26A17B': 'green', '#E5B800': 'gold', '#8B5CF6': 'purple',
                    '#FF6B35': 'orange', '#EF4444': 'red', '#34D399': 'green',
                  };
                  const chipColorName = colorMap[chip.color] || 'green';
                  return (
                    <motion.div key={`potchip-${i}`}
                      initial={{ scale: 0, opacity: 0, y: -12 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 250, damping: 18 }}
                      style={{
                        position: 'absolute',
                        left: chip.x,
                        top: chip.y,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <PokerChip size={isDesktop ? 22 : 16} color={chipColorName} />
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ===== WIN CHIPS — 팟 → 승자 좌석으로 비행 — PokerChip 사용 =====
                 ★ 칩 크기 축소 (50 → 30) */}
            <AnimatePresence>
              {winChips.map(wc => {
                const toPos = seatPositionsData[wc.toSeat] ?? [50, 100];
                const chipCount = Math.min(10, Math.max(4, Math.ceil(wc.amount / 10000)));
                const chipColor = getChipColorByValue(wc.amount);
                return Array.from({ length: chipCount }).map((_, ci) => (
                  <motion.div key={`win-${wc.key}-${ci}`}
                    className="z-40 pointer-events-none"
                    style={{ position: 'absolute', transform: 'translate(-50%, -50%)' }}
                    initial={{
                      left: `${50 + (Math.random() - 0.5) * 10}%`,
                      top: `${(isDesktop ? 47 : 49) + (Math.random() - 0.5) * 4}%`,
                      scale: 1,
                      opacity: 1,
                    }}
                    animate={{
                      left: `${toPos[0]}%`,
                      top: `${toPos[1]}%`,
                      scale: [1, 1.2, 0.7],
                      opacity: [1, 1, 0],
                      rotate: 360 + ci * 30,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.0,
                      delay: ci * 0.07,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <PokerChip size={isDesktop ? 30 : 22} color={chipColor === 'white' ? 'gold' : chipColor} />
                  </motion.div>
                ));
              })}
            </AnimatePresence>

            {/* ===== ALL-IN EQUITY DISPLAY ===== */}
            {equities && equities.length > 0 && (
              <div className="absolute top-[56%] left-1/2 -translate-x-1/2 z-10">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 px-4 py-2 rounded-xl"
                  style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,215,0,0.1)" }}>
                  {equities.map((eq, i) => {
                    const player = serverPlayers.find(p => p.id === eq.playerId);
                    return (
                      <div key={i} className="text-center">
                        <div className="text-[9px] text-[#6B7A90] truncate max-w-[60px]">
                          {player?.nickname ?? '???'}
                        </div>
                        <div className="font-mono text-sm font-black"
                          style={{ color: eq.equity > 50 ? "#34D399" : eq.equity > 30 ? "#FFD700" : "#EF4444" }}>
                          {eq.equity.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
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
                        +{getSymbol()}{(winners[0].amount / 100).toLocaleString()}
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

        {/* ★ 관전 모드 하단 소형 배너 — 중앙 게임 시야 방해 안 함.
            좌석은 PlayerSlot 빈 자리의 "SIT HERE" 버튼으로 클릭 가능.
            Quick Sit 버튼은 빈 자리 자동 탐색 fallback */}
        {!seated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none"
            style={{ bottom: 8 }}>
            <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(10,16,24,0.88)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(52,211,153,0.35)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}>
              <span style={{ fontSize: 11 }}>👁</span>
              <span className="text-[10px] text-[#8899AB] font-semibold whitespace-nowrap">
                관전 중 · 빈 자리 클릭해서 착석
              </span>
              <button
                onClick={() => {
                  const occupied = new Set(serverPlayers.map(p => p.seat));
                  let emptySeat = -1;
                  for (let i = 0; i < maxSeats; i++) {
                    if (!occupied.has(i)) { emptySeat = i; break; }
                  }
                  if (emptySeat === -1) {
                    toast.error('테이블이 꽉 찼습니다');
                    return;
                  }
                  handleSitClick(emptySeat);
                }}
                className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black text-white"
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  boxShadow: "0 2px 8px rgba(16,185,129,0.4)",
                }}>
                ⚡ Quick Sit
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ═══════ DEALING ANIMATION — GG 포커 스타일 2바퀴 ═══════
          원칙:
          - 자리당 카드 2장 (1바퀴 → 2바퀴, 진짜 포커처럼)
          - 1바퀴 모두 도착 후 2바퀴 시작 (delay 분리)
          - 1장 0.04초 간격 + 1바퀴/2바퀴 사이 0.15초 짧은 휴지
          - 직선 이동, 회전 최소
          - 총 시간 ~1.4초 (9-max 기준) */}
      <AnimatePresence>
        {forceDealAnim > 0 && (
          <div key={forceDealAnim} style={{ position: "fixed", inset: 0, zIndex: 80, pointerEvents: "none", overflow: "visible" }}>
            {(() => {
              const activeSeats = serverPlayers
                .filter(p => p.status === "ACTIVE" || p.status === "ALL_IN")
                .map(p => p.seat);
              const dealerSeat = serverPlayers.find(p => p.isDealer)?.seat ?? 0;
              const N = activeSeats.length;

              // 2바퀴 = N×2 카드, 라운드 사이 휴지 0.15s 추가
              const cards: Array<{ seat: number; round: 0 | 1; idx: number }> = [];
              activeSeats.forEach((seat, i) => cards.push({ seat, round: 0, idx: i }));
              activeSeats.forEach((seat, i) => cards.push({ seat, round: 1, idx: i }));

              return cards.map((card, ci) => {
                const pos = seatPositionsData[card.seat] ?? [50, 50];
                const tableLeft = 50, tableTop = 35, tableW = isDesktop ? 60 : 80, tableH = isDesktop ? 40 : 50;
                // 두 카드 살짝 옆으로 (좌우 분리)
                const offsetX = card.round === 0 ? -2 : 2;
                const targetX = tableLeft + (pos[0] - 50) * tableW / 200 + offsetX;
                const targetY = tableTop + pos[1] * tableH / 100;
                const dealerPos = seatPositionsData[dealerSeat] ?? [50, 50];
                const startX = tableLeft + (dealerPos[0] - 50) * tableW / 200;
                const startY = tableTop;

                // 1바퀴: 0~Nx0.04, 2바퀴: (Nx0.04 + 0.15)~ + Nx0.04
                const baseDelay = card.round === 0
                  ? card.idx * 0.04
                  : N * 0.04 + 0.15 + card.idx * 0.04;

                return (
                  <motion.div key={`fdeal-${card.seat}-${card.round}-${forceDealAnim}`}
                    style={{ position: "absolute" }}
                    initial={{
                      left: `${startX}%`, top: `${startY}%`,
                      scale: 0.5, opacity: 0,
                    }}
                    animate={{
                      left: `${targetX}%`, top: `${targetY}%`,
                      scale: 0.7, opacity: 1,
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{
                      duration: 0.35,
                      delay: baseDelay,
                      ease: "easeOut",
                    }}
                  >
                    <div style={{
                      width: 28, height: 40, borderRadius: 4,
                      background: "linear-gradient(150deg, #0E3D26, #1A5E3F, #082418)",
                      border: "1px solid rgba(255,215,0,0.25)",
                      boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
                      transform: "translate(-50%, -50%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 11, color: "rgba(255,215,0,0.5)", fontWeight: 900 }}>₮</span>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        )}
      </AnimatePresence>

      {/* ====== STUCK BANNER — 60초 활동 없음 시 강제 나가기 옵션 ====== */}
      <AnimatePresence>
        {showStuckBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-xl flex items-center gap-3"
            style={{
              background: "linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))",
              border: "1.5px solid rgba(255,255,255,0.3)",
              boxShadow: "0 8px 30px rgba(239,68,68,0.4)",
              maxWidth: "calc(100vw - 32px)",
            }}>
            <span className="text-lg">⚠️</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black text-white whitespace-nowrap">게임이 멈춘 것 같습니다</div>
              <div className="text-[9px] text-white/80">60초 동안 변화 없음</div>
            </div>
            <button
              onClick={forceLeave}
              className="px-3 py-1.5 rounded-lg text-[10px] font-black text-red-700 bg-white whitespace-nowrap"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              강제 나가기
            </button>
            <button
              onClick={() => { lastActivityRef.current = Date.now(); setShowStuckBanner(false); }}
              className="text-white/70 text-base px-1">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== HERO CARDS — hero 좌석(항상 하단 중앙) 바로 앞에 표시 ====== */}
      {myHoleCards.length >= 2 && (
        <div style={{
          position: "fixed",
          bottom: isMyTurn ? 200 : 170,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 90,
          pointerEvents: "auto",
        }}>
          <CardSqueeze
            key={`hero-${myHoleCards[0]?.suit}-${myHoleCards[0]?.rank}-${myHoleCards[1]?.suit}-${myHoleCards[1]?.rank}`}
            card1={{ suit: myHoleCards[0]!.suit as any, rank: myHoleCards[0]!.rank as any }}
            card2={{ suit: myHoleCards[1]!.suit as any, rank: myHoleCards[1]!.rank as any }}
          />
        </div>
      )}

      {/* ====== ACTION PANEL — responsive (데스크탑에서 max-w-4xl 까지 확장) ====== */}
      <div className="shrink-0 z-30 action-panel safe-bottom"
        style={{ background: "rgba(5,8,12,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="px-2 sm:px-3 md:px-4 pt-1.5 pb-1.5 sm:pt-2 sm:pb-2 max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">

          {isMyTurn ? (
            <>
              {/* Timer bar — 두껍고 눈에 띄게 */}
              <motion.div className="rounded-full mb-1.5 overflow-hidden relative" style={{ height: 6, background: "rgba(255,255,255,0.06)" }}>
                <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }}
                  transition={{ duration: (turnInfo?.timeoutMs ?? 30000) / 1000, ease: "linear" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #34D399, #FBBF24, #EF4444)", boxShadow: "0 0 10px rgba(52,211,153,0.4)" }} />
              </motion.div>

              {/* ===== Hand Strength Meter — 승률 실시간 표시 ===== */}
              {typeof turnInfo?.equity === 'number' && turnInfo.equity > 0 && (
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex-1 h-3 rounded-full overflow-hidden relative"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${turnInfo.equity}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: turnInfo.equity >= 65
                          ? "linear-gradient(90deg, #10B981, #34D399)"
                          : turnInfo.equity >= 45
                            ? "linear-gradient(90deg, #FBBF24, #FCD34D)"
                            : turnInfo.equity >= 30
                              ? "linear-gradient(90deg, #F97316, #FB923C)"
                              : "linear-gradient(90deg, #DC2626, #EF4444)",
                        boxShadow: turnInfo.equity >= 65
                          ? "0 0 10px rgba(16,185,129,0.4)"
                          : "0 0 8px rgba(251,191,36,0.3)",
                      }}
                    />
                    {/* 50% 기준선 */}
                    <div style={{
                      position: "absolute", left: "50%", top: 0, bottom: 0, width: 1,
                      background: "rgba(255,255,255,0.25)",
                    }} />
                  </div>
                  <div className="shrink-0 font-mono font-black text-[11px]"
                    style={{
                      color: turnInfo.equity >= 65 ? "#34D399"
                        : turnInfo.equity >= 45 ? "#FBBF24"
                        : turnInfo.equity >= 30 ? "#FB923C" : "#EF4444",
                      minWidth: 36, textAlign: "right",
                    }}>
                    {turnInfo.equity}%
                  </div>
                  <div className="shrink-0 text-[8px] text-[#4A5A70] font-bold uppercase tracking-wider">WIN</div>
                </div>
              )}

              {/* ===== GGPoker-style Raise Amount + Slider ===== */}
              <div className="flex items-center gap-2 mb-2">
                {/* 금액 직접 입력 */}
                <div className="shrink-0 px-2 py-1.5 rounded-lg min-w-[90px] text-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <input type="number" value={Math.round(raiseAmount / 100)}
                    onChange={e => {
                      const v = Math.max(minRaise, Math.min(maxRaise, Number(e.target.value) * 100));
                      setRaiseAmount(v);
                    }}
                    className="w-full bg-transparent text-center text-sm font-mono font-black text-white outline-none
                      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ caretColor: "#26A17B" }}
                  />
                  <div className="text-[8px] text-[#4A5A70] mt-0.5">{getSymbol()} amount</div>
                </div>
                {/* 슬라이더 */}
                <div className="flex-1 py-1">
                  <Slider value={[raiseAmount]} onValueChange={(v) => setRaiseAmount(v[0]!)}
                    min={minRaise} max={maxRaise} step={Math.max(1, Math.floor((maxRaise - minRaise) / 100))}
                    className="[&_[data-slot=slider-thumb]]:w-6 [&_[data-slot=slider-thumb]]:h-6" />
                </div>
              </div>

              {/* ===== Preset Buttons — 표준 포커 팟베팅 공식 ===== */}
              {/* raiseTo = callAmount + fraction × (pot + 2 × callAmount)
                   → 내가 콜한 후 새 팟의 fraction 만큼 레이즈 */}
              <div className="flex gap-1 mb-1.5">
                {[
                  { l: "MIN", v: minRaise, tier: 'normal' as const },
                  { l: "1/3", v: callAmount + Math.floor((pot + callAmount * 2) / 3), tier: 'normal' as const },
                  { l: "1/2", v: callAmount + Math.floor((pot + callAmount * 2) / 2), tier: 'normal' as const },
                  { l: "2/3", v: callAmount + Math.floor((pot + callAmount * 2) * 2 / 3), tier: 'normal' as const },
                  { l: "POT", v: callAmount + (pot + callAmount * 2), tier: 'normal' as const },
                ].map((p) => {
                  const clamped = Math.max(minRaise, Math.min(maxRaise, p.v));
                  const isSelected = raiseAmount === clamped;
                  return (
                    <motion.button key={p.l}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => { setRaiseAmount(clamped); playSound('click'); }}
                      className="flex-1 py-2 text-[10px] sm:text-[11px] font-black tracking-wider rounded-md transition-all"
                      style={{
                        background: isSelected
                          ? "linear-gradient(180deg, rgba(38,161,123,0.35), rgba(38,161,123,0.2))"
                          : "rgba(255,255,255,0.06)",
                        color: isSelected ? "#26A17B" : "#8899AB",
                        border: isSelected
                          ? "1px solid rgba(38,161,123,0.5)"
                          : "1px solid rgba(255,255,255,0.1)",
                        boxShadow: isSelected ? "0 0 12px rgba(38,161,123,0.25)" : "none",
                      }}>{p.l}</motion.button>
                  );
                })}
              </div>
              {/* ===== Row 2: Overbet (1.5x / 2x / 3x) + MAX ===== */}
              <div className="flex gap-1 mb-2.5">
                {[
                  { l: "1.5x", v: callAmount + Math.floor((pot + callAmount * 2) * 1.5), tier: 'overbet' as const },
                  { l: "2x",   v: callAmount + (pot + callAmount * 2) * 2, tier: 'overbet' as const },
                  { l: "3x",   v: callAmount + (pot + callAmount * 2) * 3, tier: 'overbet' as const },
                  { l: "MAX", v: maxRaise, tier: 'max' as const },
                ].map((p) => {
                  const clamped = Math.max(minRaise, Math.min(maxRaise, p.v));
                  const isSelected = raiseAmount === clamped;
                  const isMax = p.tier === 'max';
                  // 오버벳이 MAX보다 크면 비활성화
                  const disabled = !isMax && p.v > maxRaise;
                  return (
                    <motion.button key={p.l}
                      whileTap={disabled ? undefined : { scale: 0.92 }}
                      disabled={disabled}
                      onClick={() => { if (disabled) return; setRaiseAmount(clamped); playSound('click'); }}
                      className="flex-1 py-2 text-[10px] sm:text-[11px] font-black tracking-wider rounded-md transition-all"
                      style={{
                        background: disabled
                          ? "rgba(255,255,255,0.02)"
                          : isSelected
                            ? (isMax
                                ? "linear-gradient(180deg, rgba(229,184,0,0.35), rgba(229,184,0,0.2))"
                                : "linear-gradient(180deg, rgba(255,107,53,0.35), rgba(255,107,53,0.2))")
                            : "rgba(255,255,255,0.06)",
                        color: disabled
                          ? "rgba(255,255,255,0.2)"
                          : isSelected
                            ? (isMax ? "#FFD700" : "#FF8F5C")
                            : (isMax ? "#D4A437" : "#FF6B35"),
                        border: disabled
                          ? "1px solid rgba(255,255,255,0.04)"
                          : isSelected
                            ? `1px solid ${isMax ? "rgba(229,184,0,0.5)" : "rgba(255,107,53,0.5)"}`
                            : `1px solid ${isMax ? "rgba(229,184,0,0.3)" : "rgba(255,107,53,0.3)"}`,
                        boxShadow: isSelected && !disabled
                          ? `0 0 12px ${isMax ? "rgba(229,184,0,0.25)" : "rgba(255,107,53,0.25)"}`
                          : "none",
                        opacity: disabled ? 0.4 : 1,
                      }}>{p.l}</motion.button>
                  );
                })}
              </div>

              {/* ===== Top Up 미니 버튼 — 베팅 영역 위쪽 우측 (버그7: 기존엔 헤더에 있었고 모바일에선 숨겨져 있었음) ===== */}
              {seated && (
                <div className="flex justify-end mb-1.5">
                  <button
                    onClick={() => {
                      const inHand = phase !== "WAITING" && phase !== "RESULT";
                      if (inHand) {
                        toast('⏱️ 현재 핸드 종료 후 충전 가능합니다', { duration: 2500, icon: '⏳' });
                      }
                      setShowTopUpModal(true);
                    }}
                    className="px-3 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 active:scale-95"
                    style={{
                      background: "linear-gradient(180deg, rgba(52,211,153,0.18), rgba(52,211,153,0.08))",
                      color: "#34D399",
                      border: "1px solid rgba(52,211,153,0.35)",
                      boxShadow: "0 2px 8px rgba(52,211,153,0.15)",
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Chips
                  </button>
                </div>
              )}

              {/* ===== Action Buttons — GGPoker 3-button (FOLD / CHECK·CALL / RAISE·ALLIN) ===== */}
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.93 }} onClick={handleFold}
                  className="flex-1 py-3.5 sm:py-4 rounded-xl active:brightness-110 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(180deg, #D32F2F 0%, #B71C1C 100%)",
                    boxShadow: "0 4px 14px rgba(211,47,47,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}>
                  <span className="text-white text-[13px] sm:text-[14px] font-black uppercase tracking-widest">Fold</span>
                </motion.button>

                <motion.button whileTap={{ scale: 0.93 }} onClick={canCheck ? handleCheck : handleCall}
                  className="flex-[1.5] py-3.5 sm:py-4 rounded-xl active:brightness-110 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(180deg, #388E3C 0%, #1B5E20 100%)",
                    boxShadow: "0 4px 14px rgba(56,142,60,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}>
                  <div className="flex flex-col items-center">
                    <span className="text-white text-[13px] sm:text-[14px] font-black uppercase tracking-widest">
                      {canCheck ? "Check" : "Call"}
                    </span>
                    {!canCheck && (
                      <span className="text-white/70 text-[10px] font-mono font-bold">
                        {getSymbol()}{(callAmount/100).toLocaleString()}
                      </span>
                    )}
                  </div>
                </motion.button>

                <motion.button whileTap={{ scale: 0.93 }}
                  onClick={raiseAmount >= maxRaise ? handleAllIn : handleRaise}
                  className="flex-[1.3] py-3.5 sm:py-4 rounded-xl active:brightness-110 relative overflow-hidden"
                  style={{
                    background: raiseAmount >= maxRaise
                      ? "linear-gradient(180deg, #E5A100 0%, #B8860B 100%)"
                      : "linear-gradient(180deg, #1976D2 0%, #0D47A1 100%)",
                    boxShadow: raiseAmount >= maxRaise
                      ? "0 4px 14px rgba(229,161,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)"
                      : "0 4px 14px rgba(25,118,210,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}>
                  <div className="flex flex-col items-center">
                    <span className="text-white text-[13px] sm:text-[14px] font-black uppercase tracking-widest">
                      {raiseAmount >= maxRaise ? "All In" : "Raise"}
                    </span>
                    <span className="text-white/70 text-[10px] font-mono font-bold">
                      {getSymbol()}{(raiseAmount/100).toLocaleString()}
                    </span>
                  </div>
                  {/* ALL-IN 골드 글로우 */}
                  {raiseAmount >= maxRaise && (
                    <motion.div className="absolute inset-0 rounded-xl pointer-events-none"
                      animate={{ opacity: [0, 0.15, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ background: "radial-gradient(circle, rgba(255,215,0,0.3), transparent 70%)" }} />
                  )}
                </motion.button>
              </div>
            </>
          ) : seated && phase !== "WAITING" && phase !== "RESULT" ? (
            /* Pre-action buttons — select action before your turn */
            <div className="py-3">
              <div className="text-[9px] text-[#2A3650] text-center mb-2 uppercase tracking-wider">Pre-select action</div>
              <div className="flex gap-2 justify-center mb-2">
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
              {/* Cash Out 요청 버튼 — 올인 상태일 때 표시 */}
              {myStack === 0 && communityCards.length < 5 && communityCards.length > 0 && (
                <div className="flex justify-center">
                  <button onClick={() => { send({ type: 'CASH_OUT', accept: false } as any); playSound('click'); }}
                    className="px-4 py-2 rounded-lg text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1.5"
                    style={{
                      background: "linear-gradient(180deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))",
                      color: "#34D399",
                      border: "1px solid rgba(52,211,153,0.35)",
                      boxShadow: "0 2px 10px rgba(52,211,153,0.15)",
                    }}>
                    💰 Request Cash Out
                  </button>
                </div>
              )}
            </div>
          ) : isWaitingForBB ? (
            /* WAIT_BB 상태 — Post BB 옵션 표시 */
            <div className="py-3">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="w-2 h-2 rounded-full" style={{ background: "#FBBF24" }}
                  />
                  <span className="text-[11px] font-bold text-[#FBBF24] uppercase tracking-wider">
                    Waiting for Big Blind
                  </span>
                </div>
                <div className="text-[9px] text-[#6B7A90] text-center max-w-[280px]">
                  다음 BB가 자기 자리에 오면 자동 입장합니다. 즉시 입장하려면 데드 BB를 내세요.
                </div>
                <button
                  onClick={() => { send({ type: 'POST_BB' } as any); toast.success('Will post BB next hand'); playSound('click'); }}
                  className="px-5 py-2 rounded-lg text-[12px] font-black text-white transition-all active:scale-95 mt-1"
                  style={{
                    background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
                    boxShadow: "0 4px 16px rgba(251,191,36,0.35)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}>
                  💰 Post BB & Join Next Hand
                </button>
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
        minBuyIn={50000} maxBuyIn={2000000} currentBalance={realBalance}
        tableName="NL Hold'em" blinds="50/100" onJoinTable={handleBuyIn} />

      {/* ===== Leave Confirm Modal ===== */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="rounded-2xl p-6 text-center max-w-[320px]"
              style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-base font-bold text-white mb-2">Leave Table?</div>
              <div className="text-xs text-[#6B7A90] mb-5">Your chips will be cashed out automatically.</div>
              <div className="flex flex-col gap-2">
                {/* Reserved leave — safely leave after next hand */}
                {!leaveReserved ? (
                  <button onClick={() => {
                    setLeaveReserved(true);
                    setShowLeaveConfirm(false);
                    toast('You will leave after the current hand', { icon: '⏱️' });
                  }}
                    className="w-full py-2.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #F0B90B, #E5A00D)" }}>
                    Leave After This Hand
                  </button>
                ) : (
                  <button onClick={() => {
                    setLeaveReserved(false);
                    toast.success('Leave reservation cancelled');
                  }}
                    className="w-full py-2.5 rounded-lg text-xs font-bold text-[#F0B90B] border border-[#F0B90B]/40">
                    Cancel Reservation
                  </button>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowLeaveConfirm(false)}
                    className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-[#6B7A90] bg-white/[0.03] border border-white/[0.06]">
                    Keep Playing
                  </button>
                  <button onClick={confirmLeave}
                    className="flex-1 py-2.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}>
                    Leave Now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Hand History Modal ===== */}
      <AnimatePresence>
        {showHandHistory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3"
            onClick={() => setShowHandHistory(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="rounded-2xl w-full max-w-[520px] max-h-[85vh] flex flex-col overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #141820, #0B1018)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(38,161,123,0.15)", border: "1px solid rgba(38,161,123,0.3)" }}>
                    <span className="text-sm">📜</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">핸드 히스토리</h3>
                    <p className="text-[10px] text-[#4A5A70]">최근 {handHistoryRecords.length}개 핸드 기록</p>
                  </div>
                </div>
                <button onClick={() => setShowHandHistory(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7A90] hover:bg-white/[0.05]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {handHistoryRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-2">🃏</div>
                    <div className="text-sm text-[#4A5A70] font-semibold">아직 플레이한 핸드가 없습니다</div>
                    <div className="text-[10px] text-[#3D4F65] mt-1">게임을 진행하면 여기에 기록됩니다</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {handHistoryRecords.slice().reverse().map((rec: any, i: number) => {
                      const board: any[] = rec.board ?? [];
                      const winner = rec.winners?.[0];
                      const suitSymbols = ['', '♠', '♥', '♦', '♣'];
                      const suitColors = ['', '#FFFFFF', '#EF4444', '#60A5FA', '#34D399'];
                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="p-4 rounded-xl"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.04)",
                          }}>

                          {/* Top: Hand # + Time */}
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                                style={{ background: "rgba(255,107,53,0.1)", color: "#FF6B35" }}>
                                #{rec.handNumber ?? (handHistoryRecords.length - i)}
                              </span>
                              <span className="text-[10px] text-[#4A5A70]">
                                {new Date(rec.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono font-bold text-[#FFD700]">
                              Pot: {getSymbol()}{((rec.pot ?? 0) / 100).toLocaleString()}
                            </div>
                          </div>

                          {/* Community Cards */}
                          {board.length > 0 && (
                            <div className="flex items-center gap-1.5 mb-3 justify-center">
                              {board.map((c, idx) => {
                                const rankMap: Record<number, string> = {1:'A',2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',11:'J',12:'Q',13:'K'};
                                return (
                                  <div key={idx} className="flex flex-col items-center justify-center rounded-md"
                                    style={{
                                      width: 32, height: 44,
                                      background: "#FFFFFF",
                                      border: "1px solid rgba(0,0,0,0.1)",
                                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                    }}>
                                    <span className="text-[11px] font-black leading-none" style={{ color: suitColors[c.suit] === '#FFFFFF' ? '#111' : suitColors[c.suit] }}>
                                      {rankMap[c.rank] ?? c.rank}
                                    </span>
                                    <span className="text-[10px] leading-none" style={{ color: suitColors[c.suit] === '#FFFFFF' ? '#111' : suitColors[c.suit] }}>
                                      {suitSymbols[c.suit]}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Winner */}
                          {winner && (
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg"
                              style={{
                                background: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.03))",
                                border: "1px solid rgba(52,211,153,0.2)",
                              }}>
                              <div className="flex items-center gap-2">
                                <span className="text-base">🏆</span>
                                <div>
                                  <div className="text-[11px] font-bold text-white">{winner.nickname ?? 'Unknown'}</div>
                                  {winner.handResult?.description && (
                                    <div className="text-[9px] text-[#34D399] font-semibold">
                                      {winner.handResult.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="font-mono font-black text-[13px] text-[#34D399]">
                                +{getSymbol()}{((winner.amount ?? 0) / 100).toLocaleString()}
                              </div>
                            </div>
                          )}

                          {/* Rake */}
                          {rec.rake > 0 && (
                            <div className="mt-2 text-[9px] text-[#4A5A70] text-right">
                              Rake: {getSymbol()}{(rec.rake / 100).toLocaleString()}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Rabbit Hunt results */}
                {rabbitCards.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl"
                    style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)" }}>
                    <div className="text-[10px] text-[#FFD700] font-bold mb-1 flex items-center gap-1">
                      🐇 Rabbit Hunt
                    </div>
                    <div className="text-[11px] text-[#8899AB]">
                      만약 끝까지 갔다면: {rabbitCards.map((c: any) => `${c.rank}${['','♠','♥','♦','♣'][c.suit]}`).join(' ')}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/[0.06]">
                <button onClick={() => setShowHandHistory(false)}
                  className="w-full py-2.5 rounded-lg text-xs font-bold"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "#8899AB",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ Top-Up Modal ═══════ */}
      <AnimatePresence>
        {showTopUpModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowTopUpModal(false)}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-5"
              style={{ background: "linear-gradient(180deg, #141820, #0B0E14)", border: "1px solid rgba(52,211,153,0.3)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-white">💰 Top Up</h3>
                <button onClick={() => setShowTopUpModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#6B7A90]"
                  style={{ background: "rgba(255,255,255,0.05)" }}>✕</button>
              </div>
              <div className="text-[11px] text-[#6B7A90] mb-4">
                Add more chips to your stack. Only available between hands.
              </div>
              <TopUpForm
                currentStack={serverPlayers.find(p => p.seat === heroSeat)?.stack ?? 0}
                send={send}
                onDone={() => setShowTopUpModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ Change Seat Modal ═══════ */}
      <AnimatePresence>
        {showChangeSeatModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowChangeSeatModal(false)}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-5"
              style={{ background: "linear-gradient(180deg, #141820, #0B0E14)", border: "1px solid rgba(124,58,237,0.3)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-white">🪑 Change Seat</h3>
                <button onClick={() => setShowChangeSeatModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#6B7A90]"
                  style={{ background: "rgba(255,255,255,0.05)" }}>✕</button>
              </div>
              <div className="text-[11px] text-[#6B7A90] mb-3">
                Select an empty seat. You must wait until the current hand ends.
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {Array.from({ length: maxSeats }).map((_, i) => {
                  const isEmpty = emptySeats.includes(i);
                  const isMine = i === heroSeat;
                  return (
                    <button key={i}
                      disabled={!isEmpty || isMine}
                      onClick={() => {
                        send({ type: 'CHANGE_SEAT', seat: i });
                        toast.success(`Seat change requested (${i + 1})`);
                        setShowChangeSeatModal(false);
                      }}
                      className="py-3 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
                      style={{
                        background: isMine ? "rgba(255,215,0,0.15)" :
                                    isEmpty ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.02)",
                        color: isMine ? "#FFD700" : isEmpty ? "#34D399" : "#4A5A70",
                        border: `1px solid ${isMine ? "rgba(255,215,0,0.3)" : isEmpty ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.04)"}`,
                      }}>
                      {isMine ? `Seat ${i + 1} (You)` : `Seat ${i + 1}`}
                      <div className="text-[9px] opacity-60 mt-0.5">
                        {isMine ? 'Current' : isEmpty ? 'Empty' : 'Taken'}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => { send({ type: 'GET_EMPTY_SEATS' }); }}
                className="w-full py-2 rounded-lg text-[10px] text-[#8899AB]"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                🔄 Refresh available seats
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ Pre-Action Panel ═══════ */}
      <AnimatePresence>
        {showPreActionPanel && (
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
            className="fixed right-3 bottom-28 z-[200] p-3 rounded-2xl min-w-[240px]"
            style={{
              background: "rgba(14,17,25,0.96)",
              border: "1px solid rgba(240,185,11,0.3)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            }}>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-[11px] font-black text-[#F0B90B] uppercase tracking-wider">⚡ Pre-Action</h4>
              <button onClick={() => setShowPreActionPanel(false)}
                className="w-5 h-5 rounded text-[#6B7A90] text-[11px]"
                style={{ background: "rgba(255,255,255,0.05)" }}>✕</button>
            </div>
            <div className="space-y-1.5">
              {([
                { id: null as any, label: 'None (manual)', color: '#6B7A90' },
                { id: 'check', label: 'Check', color: '#34D399' },
                { id: 'check_fold', label: 'Check/Fold', color: '#60A5FA' },
                { id: 'call_any', label: 'Call Any', color: '#F0B90B' },
                { id: 'fold', label: 'Fold', color: '#EF4444' },
              ] as const).map(opt => (
                <button key={opt.label}
                  onClick={() => {
                    setPreAction(opt.id as any);
                    // 액션 매핑: fold=0, check=1, check/fold=1(check로 시도), call_any=2
                    const mapped =
                      opt.id === 'fold' ? 0 :
                      opt.id === 'check' ? 1 :
                      opt.id === 'check_fold' ? 1 :
                      opt.id === 'call_any' ? 2 : null;
                    send({ type: 'SET_PRE_ACTION', action: mapped });
                  }}
                  className="w-full py-2 rounded-lg text-[11px] font-bold flex items-center justify-between px-3 transition-all"
                  style={{
                    background: preAction === opt.id ? `${opt.color}20` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${preAction === opt.id ? opt.color + '50' : 'rgba(255,255,255,0.05)'}`,
                    color: preAction === opt.id ? opt.color : '#8899AB',
                  }}>
                  <span>{opt.label}</span>
                  {preAction === opt.id && <span>✓</span>}
                </button>
              ))}
            </div>
            <div className="text-[9px] text-[#4A5A70] mt-2 text-center">
              Auto-execute when it's your turn
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Emoji Picker — GGPoker+ 스타일 ===== */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-5 py-4 rounded-2xl"
            style={{ background: "rgba(15,20,28,0.97)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", boxShadow: "0 10px 40px rgba(0,0,0,0.6)" }}>
            {/* 카테고리 */}
            <div className="text-[9px] text-[#4A5A70] uppercase tracking-wider mb-2 font-semibold">Reactions</div>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {[
                { emoji: '😂', label: 'LOL' },
                { emoji: '😡', label: 'Angry' },
                { emoji: '😢', label: 'Sad' },
                { emoji: '🤩', label: 'Wow' },
                { emoji: '😎', label: 'Cool' },
                { emoji: '🤔', label: 'Think' },
              ].map(e => (
                <motion.button key={e.emoji}
                  whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.8 }}
                  onClick={() => {
                    send({ type: 'CHAT', message: e.emoji });
                    setFloatingEmoji({ emoji: e.emoji, seat: heroSeat, key: Date.now() });
                    setTimeout(() => setFloatingEmoji(null), 2500);
                    setShowEmoji(false);
                    playSound('click');
                  }}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors hover:bg-white/[0.05]">
                  <span className="text-3xl">{e.emoji}</span>
                  <span className="text-[8px] text-[#4A5A70]">{e.label}</span>
                </motion.button>
              ))}
            </div>
            <div className="text-[9px] text-[#4A5A70] uppercase tracking-wider mb-2 font-semibold">Actions</div>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {[
                { emoji: '👍', label: 'GG' },
                { emoji: '👏', label: 'Nice' },
                { emoji: '🔥', label: 'Hot' },
                { emoji: '💪', label: 'Strong' },
                { emoji: '💀', label: 'Dead' },
                { emoji: '🎉', label: 'Party' },
              ].map(e => (
                <motion.button key={e.emoji}
                  whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.8 }}
                  onClick={() => {
                    send({ type: 'CHAT', message: e.emoji });
                    setFloatingEmoji({ emoji: e.emoji, seat: heroSeat, key: Date.now() });
                    setTimeout(() => setFloatingEmoji(null), 2500);
                    setShowEmoji(false);
                    playSound('click');
                  }}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors hover:bg-white/[0.05]">
                  <span className="text-3xl">{e.emoji}</span>
                  <span className="text-[8px] text-[#4A5A70]">{e.label}</span>
                </motion.button>
              ))}
            </div>
            <div className="text-[9px] text-[#4A5A70] uppercase tracking-wider mb-2 font-semibold">Taunt</div>
            <div className="grid grid-cols-6 gap-2">
              {[
                { emoji: '🃏', label: 'Bluff' },
                { emoji: '💰', label: 'Money' },
                { emoji: '🏆', label: 'Win' },
                { emoji: '😈', label: 'Devil' },
                { emoji: '🐟', label: 'Fish' },
                { emoji: '🦈', label: 'Shark' },
              ].map(e => (
                <motion.button key={e.emoji}
                  whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.8 }}
                  onClick={() => {
                    send({ type: 'CHAT', message: e.emoji });
                    setFloatingEmoji({ emoji: e.emoji, seat: heroSeat, key: Date.now() });
                    setTimeout(() => setFloatingEmoji(null), 2500);
                    setShowEmoji(false);
                    playSound('click');
                  }}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors hover:bg-white/[0.05]">
                  <span className="text-3xl">{e.emoji}</span>
                  <span className="text-[8px] text-[#4A5A70]">{e.label}</span>
                </motion.button>
              ))}
            </div>
            <button onClick={() => setShowEmoji(false)}
              className="w-full mt-3 py-2 rounded-lg text-[10px] text-[#4A5A70] bg-white/[0.03]">Close</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Floating Emoji Animation — 플레이어 위에 큰 이모티콘 팝업 ===== */}
      <AnimatePresence>
        {floatingEmoji && (
          <motion.div
            key={floatingEmoji.key}
            className="fixed z-[100] pointer-events-none"
            style={{ left: "50%", top: "40%" }}
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 1], y: [20, -20, -40] }}
            exit={{ scale: 2, opacity: 0, y: -80 }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            <div style={{ transform: "translate(-50%, -50%)", textAlign: "center" }}>
              <motion.span style={{ fontSize: 80, display: "block" }}
                animate={{ rotate: [0, -10, 10, -5, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}>
                {floatingEmoji.emoji}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Show/Muck Prompt (승리 후) ===== */}
      <AnimatePresence>
        {showMuckPrompt && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl"
            style={{ background: "rgba(20,24,32,0.95)", border: "1px solid rgba(52,211,153,0.15)", backdropFilter: "blur(12px)" }}>
            <div className="text-[10px] text-[#6B7A90] text-center mb-2">Show your cards?</div>
            <div className="flex gap-3">
              <button onClick={() => { send({ type: 'SHOW_CARDS' }); useGameStore.setState({ showMuckPrompt: false }); playSound('click'); }}
                className="px-4 py-2 rounded-lg text-xs font-bold text-[#34D399]"
                style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                Show
              </button>
              <button onClick={() => { send({ type: 'MUCK_CARDS' }); useGameStore.setState({ showMuckPrompt: false }); playSound('click'); }}
                className="px-4 py-2 rounded-lg text-xs font-bold text-[#6B7A90]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                Muck
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Cash Out Offer (GGPoker-style) ===== */}
      <AnimatePresence>
        {cashOutOffer && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="rounded-2xl p-5 w-full max-w-[340px]"
              style={{
                background: "linear-gradient(180deg, #141820, #0B1018)",
                border: "1px solid rgba(52,211,153,0.3)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(52,211,153,0.15)",
              }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}>
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <div className="text-sm font-black text-[#34D399]">Cash Out Available</div>
                  <div className="text-[10px] text-[#6B7A90]">Skip the showdown, take your equity now</div>
                </div>
              </div>

              {/* Equity bar */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#6B7A90] uppercase tracking-wider">Your Equity</span>
                  <span className="text-[#34D399] font-mono font-black">{cashOutOffer.equity}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${cashOutOffer.equity}%`,
                      background: "linear-gradient(90deg, #10B981, #34D399)",
                    }} />
                </div>
              </div>

              {/* Amount breakdown */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-[9px] text-[#4A5A70] uppercase">Cash Out</div>
                  <div className="font-mono text-base text-[#34D399] font-black">
                    {formatMoney(cashOutOffer.offerAmount / 100)}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-[9px] text-[#4A5A70] uppercase">Fee</div>
                  <div className="font-mono text-base text-[#FF6B35] font-black">
                    {(cashOutOffer.feeRate * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { send({ type: 'CASH_OUT', accept: true } as any); useGameStore.setState({ cashOutOffer: null }); playSound('chipBet'); }}
                  className="flex-1 py-3 rounded-xl text-xs font-black text-white uppercase tracking-wider"
                  style={{
                    background: "linear-gradient(180deg, #10B981, #047857)",
                    boxShadow: "0 4px 14px rgba(16,185,129,0.4)",
                  }}>
                  Cash Out
                </button>
                <button onClick={() => useGameStore.setState({ cashOutOffer: null })}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-[#8899AB] uppercase tracking-wider"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Run Cards
                </button>
              </div>
              <div className="text-[9px] text-[#4A5A70] text-center mt-2">
                Run Cards = See the remaining community cards (normal)
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Insurance Offer ===== */}
      <AnimatePresence>
        {insuranceOffer && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="rounded-2xl p-5 max-w-[320px] text-center"
              style={{ background: "#141820", border: "1px solid rgba(255,215,0,0.1)" }}>
              <div className="text-sm font-bold text-[#FFD700] mb-1">Insurance Available</div>
              <div className="text-[11px] text-[#6B7A90] mb-4">Protect your hand against bad beats</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="text-[9px] text-[#4A5A70]">Premium</div>
                  <div className="font-mono text-sm text-[#FF6B35] font-bold">{formatMoney(insuranceOffer.premium / 100)}</div>
                </div>
                <div className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="text-[9px] text-[#4A5A70]">Payout</div>
                  <div className="font-mono text-sm text-[#34D399] font-bold">{formatMoney(insuranceOffer.payout / 100)}</div>
                </div>
              </div>
              <div className="text-[10px] text-[#4A5A70] mb-4">
                Equity: {insuranceOffer.equity.toFixed(1)}% | Outs: {insuranceOffer.outs}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { send({ type: 'BUY_INSURANCE', accept: true }); useGameStore.setState({ insuranceOffer: null }); }}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)" }}>
                  Buy Insurance
                </button>
                <button onClick={() => useGameStore.setState({ insuranceOffer: null })}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-[#6B7A90] bg-white/[0.03] border border-white/[0.06]">
                  No Thanks
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Rabbit Hunt Popup (결과 화면에서) ===== */}
      <AnimatePresence>
        {rabbitCards.length > 0 && phase === "RESULT" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-32 right-6 z-50 px-4 py-3 rounded-xl max-w-[200px]"
            style={{ background: "rgba(20,24,32,0.95)", border: "1px solid rgba(255,215,0,0.1)", backdropFilter: "blur(12px)" }}>
            <div className="text-[10px] text-[#FFD700] font-bold mb-1">🐇 Rabbit Hunt</div>
            <div className="text-[11px] text-[#8899AB]">
              {rabbitCards.map((c: any, i: number) => (
                <span key={i} className="font-mono">{' '}{['','♣','♥','♦','♠'][c.suit]}{c.rank}</span>
              ))}
            </div>
            <button onClick={() => useGameStore.setState({ rabbitCards: [] })}
              className="text-[9px] text-[#4A5A70] mt-1 hover:text-white">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Top-Up Form — 수동 스택 충전
// ─────────────────────────────────────────────────────
function TopUpForm({ currentStack, send, onDone }: {
  currentStack: number;
  send: (msg: any) => void;
  onDone: () => void;
}) {
  // ★ 서버는 cents 단위 기대 (Math.floor(topUpAmount / 100) = KRW)
  // 5,000,000 cents = 50,000원 — 주석과 실제값 일치 (이전: useState(50000) = 500원 버그)
  const [amount, setAmount] = useState(5000000);
  const presets = [
    { label: '₩50K',  value: 5000000 },
    { label: '₩100K', value: 10000000 },
    { label: '₩250K', value: 25000000 },
    { label: '₩500K', value: 50000000 },
    { label: '₩1M',   value: 100000000 },
  ];

  const handleSubmit = () => {
    if (amount < 5000000) {
      toast.error('최소 ₩50,000 이상 입력하세요');
      return;
    }
    send({ type: 'TOP_UP', amount });
    toast.success(`Top Up 요청: ₩${(amount / 100).toLocaleString()}`);
    onDone();
  };

  return (
    <div className="space-y-3">
      <div className="bg-[#0a0b10] rounded-lg p-3 border border-white/5">
        <div className="text-[10px] text-[#4A5A70] uppercase">Current Stack</div>
        <div className="text-lg font-mono font-black text-[#34D399]">
          ₩{(currentStack / 100).toLocaleString()}
        </div>
      </div>
      <div>
        <label className="text-[10px] text-[#6B7A90] uppercase tracking-wider">Top-Up Amount</label>
        <input type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          className="w-full mt-1 bg-[#0a0b10] border border-white/5 rounded-lg px-3 py-2 text-sm text-white font-mono"
        />
        <div className="grid grid-cols-5 gap-1 mt-2">
          {presets.map(p => (
            <button key={p.label}
              onClick={() => setAmount(p.value)}
              className="py-1.5 rounded text-[10px] font-bold"
              style={{
                background: amount === p.value ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.03)",
                color: amount === p.value ? "#34D399" : "#6B7A90",
                border: `1px solid ${amount === p.value ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.05)"}`,
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onDone}
          className="flex-1 py-2.5 rounded-lg text-xs font-bold text-[#6B7A90]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          Cancel
        </button>
        <button onClick={handleSubmit}
          className="flex-1 py-2.5 rounded-lg text-xs font-black text-white"
          style={{ background: "linear-gradient(135deg, #34D399, #059669)" }}>
          Top Up
        </button>
      </div>
    </div>
  );
}
