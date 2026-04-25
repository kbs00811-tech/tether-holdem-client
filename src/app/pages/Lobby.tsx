import { formatMoney } from "../utils/currency";
import { Link, useNavigate } from "react-router";
import { Users, Filter, Plus, Trophy, Activity, Crown, Flame, Zap, Star, Clock, DollarSign, Play, LayoutGrid, List, User, Volume2, VolumeX, Music } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { CreateRoomModal, RoomConfig } from "../components/CreateRoomModal";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "../stores/gameStore";
import { useSocket } from "../hooks/useSocket";
import { useStatsStore } from "../stores/statsStore";
import { useSettingsStore, AVATAR_IMAGES, TABLE_FELTS } from "../stores/settingsStore";
import { CountryPicker } from "../components/CountryPicker";
import { useEmbedMode } from "../hooks/useEmbedMode";
import {
  startLobbyBGM, stopLobbyBGM, isLobbyBGMPlaying, isSoundMuted,
  LOBBY_BGM_TRACKS, setLobbyBGMTrack, getLobbyBGMId,
} from "../hooks/useSound";
import { useT, useLocale, SUPPORTED_LOCALES, type LocaleCode } from "../../i18n";

interface PokerRoom {
  id: string;
  name: string;
  smallBlind: number;
  bigBlind: number;
  currentPlayers: number;
  maxPlayers: number;
  minBuyIn: number;
  maxBuyIn: number;
  status: "waiting" | "playing" | "starting";
  variant: string;
}

const mockRooms: PokerRoom[] = [
  { id: "1", name: "Beginner 500/1K",  smallBlind: 500,   bigBlind: 1000,   currentPlayers: 4, maxPlayers: 9, minBuyIn: 50000,   maxBuyIn: 200000,   status: "playing", variant: "NL" },
  { id: "2", name: "Beginner 1K/2K",   smallBlind: 1000,  bigBlind: 2000,   currentPlayers: 3, maxPlayers: 9, minBuyIn: 100000,  maxBuyIn: 400000,   status: "playing", variant: "NL" },
  { id: "3", name: "Standard 2K/5K",   smallBlind: 2000,  bigBlind: 5000,   currentPlayers: 6, maxPlayers: 9, minBuyIn: 250000,  maxBuyIn: 1000000,  status: "playing", variant: "NL" },
  { id: "4", name: "Standard 5K/10K",  smallBlind: 5000,  bigBlind: 10000,  currentPlayers: 2, maxPlayers: 9, minBuyIn: 500000,  maxBuyIn: 2000000,  status: "waiting", variant: "NL" },
  { id: "5", name: "High 10K/20K",     smallBlind: 10000, bigBlind: 20000,  currentPlayers: 5, maxPlayers: 9, minBuyIn: 1000000, maxBuyIn: 4000000,  status: "playing", variant: "NL" },
  { id: "6", name: "High 20K/50K",     smallBlind: 20000, bigBlind: 50000,  currentPlayers: 0, maxPlayers: 9, minBuyIn: 2000000, maxBuyIn: 10000000, status: "waiting", variant: "NL" },
  { id: "7", name: "VIP 50K/100K",     smallBlind: 50000, bigBlind: 100000, currentPlayers: 1, maxPlayers: 9, minBuyIn: 5000000, maxBuyIn: 20000000, status: "waiting", variant: "NL" },
  { id: "8", name: "VIP 100K/200K",    smallBlind: 100000,bigBlind: 200000, currentPlayers: 0, maxPlayers: 9, minBuyIn: 10000000,maxBuyIn: 40000000, status: "waiting", variant: "NL" },
  { id: "9", name: "HU 5K/10K",        smallBlind: 5000,  bigBlind: 10000,  currentPlayers: 0, maxPlayers: 2, minBuyIn: 500000,  maxBuyIn: 2000000,  status: "waiting", variant: "HU" },
  { id: "10",name: "6-Max 2K/5K",      smallBlind: 2000,  bigBlind: 5000,   currentPlayers: 3, maxPlayers: 6, minBuyIn: 250000,  maxBuyIn: 1000000,  status: "playing", variant: "NL" },
];

const holdemCategories = [
  { icon: Flame, label: "All", color: "#FF6B35" },
  { icon: DollarSign, label: "Beginner", color: "#34D399" },
  { icon: Zap, label: "Standard", color: "#60A5FA" },
  { icon: Crown, label: "High Roller", color: "#E5B800" },
  { icon: Users, label: "Heads-Up", color: "#22D3EE" },
  { icon: Trophy, label: "Tournament", color: "#A78BFA" },
];

export default function Lobby() {
  const t = useT();
  const [locale, setLocale] = useLocale();
  const navigate = useNavigate();
  const { send, connected } = useSocket();
  const serverRooms = useGameStore(s => s.rooms);

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showBGMPicker, setShowBGMPicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{ roomId: string; roomName: string } | null>(null);
  // V22: 친구 초대 코드로 빠른 입장
  const [joinByCodeInput, setJoinByCodeInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // ─── 로비 BGM: 첫 인터랙션 시 자동 재생 ───
  const [lobbyBGMActive, setLobbyBGMActive] = useState(false);
  const [selectedLobbyTrack, setSelectedLobbyTrack] = useState(getLobbyBGMId());
  const bgmStartedRef = useRef(false);

  // 첫 click/touch 시 BGM 시작 (브라우저 autoplay 정책 우회)
  useEffect(() => {
    if (bgmStartedRef.current) return;
    const tryStart = () => {
      if (!isSoundMuted() && !bgmStartedRef.current) {
        bgmStartedRef.current = true;
        startLobbyBGM();
        setLobbyBGMActive(true);
      }
      document.removeEventListener('click', tryStart);
      document.removeEventListener('touchstart', tryStart);
    };
    // 즉시 시도 (이미 인터랙션 있었을 수 있음)
    if (!isSoundMuted()) {
      startLobbyBGM();
      // play()가 성공하면 바로 active
      setTimeout(() => {
        if (isLobbyBGMPlaying()) {
          bgmStartedRef.current = true;
          setLobbyBGMActive(true);
        }
      }, 200);
    }
    document.addEventListener('click', tryStart, { once: true });
    document.addEventListener('touchstart', tryStart, { once: true });
    return () => {
      stopLobbyBGM();
      bgmStartedRef.current = false;
      document.removeEventListener('click', tryStart);
      document.removeEventListener('touchstart', tryStart);
    };
  }, []);

  // P3: Telegram 연동 상태 (store 구독)
  const tgLink = useGameStore(s => s.tgLink);

  // 프로필 패널 열 때 상태 요청 + 미연동이면 링크 URL 자동 요청 (iOS 호환)
  useEffect(() => {
    if (!showProfilePanel || !connected) return;
    send({ type: 'LINK_TELEGRAM_STATUS' } as any);
  }, [showProfilePanel, connected, send]);

  // 상태 확인 후 미연동이면 즉시 링크 토큰 prefetch (iOS 팝업 차단 회피)
  useEffect(() => {
    if (!showProfilePanel || !connected) return;
    if (tgLink.linked) return;
    if (tgLink.pendingUrl) return;
    // tgLink 상태가 확정된 후(linked=false) 자동 토큰 요청
    send({ type: 'LINK_TELEGRAM_REQUEST' } as any);
  }, [showProfilePanel, connected, tgLink.linked, tgLink.pendingUrl, send]);

  const handleOptInChange = useCallback((key: 'turn' | 'win' | 'allIn' | 'invite', value: boolean) => {
    if (!connected || !tgLink.linked) return;
    const nextOpt = { ...(tgLink.optIns || { turn: true, win: true, allIn: false, invite: true }), [key]: value };
    send({ type: 'LINK_TELEGRAM_OPT_INS', optIns: nextOpt } as any);
  }, [connected, tgLink, send]);

  // P1: 첫 진입 시 텔레그램 채널 구독 유도 (1회만)
  useEffect(() => {
    const shown = localStorage.getItem('tg_channel_prompt_v1');
    if (shown) return;
    const timer = setTimeout(() => {
      toast('📢 텔레그램 채널 참여하세요!', {
        description: '새 방 오픈·VIP 이벤트 알림을 가장 먼저 받아보세요',
        action: {
          label: 'JOIN',
          onClick: () => window.open('https://t.me/+EvLlkdY7mAFkMjdl', '_blank', 'noopener,noreferrer'),
        },
        duration: 12000,
      });
      localStorage.setItem('tg_channel_prompt_v1', '1');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const toggleLobbyBGM = useCallback(() => {
    if (isLobbyBGMPlaying()) {
      stopLobbyBGM();
      setLobbyBGMActive(false);
    } else {
      startLobbyBGM();
      setLobbyBGMActive(true);
    }
  }, []);

  const handleLobbyTrackChange = useCallback((trackId: string) => {
    setLobbyBGMTrack(trackId);
    setSelectedLobbyTrack(trackId);
    setLobbyBGMActive(true);
  }, []);
  // 실제 접속자 수 — 모든 방의 playerCount 합산 (AI 봇 포함)
  const onlineCount = serverRooms.reduce((sum, r) => sum + (r.playerCount || 0), 0);

  // ─── 내 정보 (프로필 패널) ───
  const currentAvatar = useSettingsStore(s => s.avatar);
  const setAvatar = useSettingsStore(s => s.setAvatar);
  const countryCode = useSettingsStore(s => s.countryCode);
  const setCountryCode = useSettingsStore(s => s.setCountryCode);
  // V22 Phase 2+: ProfilePanel 에서 Table Felt 직접 변경
  const tableFelt = useSettingsStore(s => s.tableFelt);
  const setTableFelt = useSettingsStore(s => s.setTableFelt);
  const { user: embedUser } = useEmbedMode();
  const localStatsTotal = useStatsStore(s => s.totalHands);
  const localStatsWon = useStatsStore(s => s.handsWon);
  const localStatsWinRate = useStatsStore(s => s.getWinRate());
  const localStatsNet = useStatsStore(s => s.getNetProfit());
  // 편집 상태 (저장 버튼 패턴)
  const [pendingAvatar, setPendingAvatar] = useState<number | null>(null);
  const [editingNickname, setEditingNickname] = useState(false);
  const [pendingNickname, setPendingNickname] = useState('');
  // 리스트/그리드 뷰 — 모바일은 grid 강제 (list는 desktop 전용 GG 포커 스타일)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [viewModeRaw, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window === 'undefined') return 'list';
    return (localStorage.getItem('lobby_view_mode') as 'list' | 'grid') || 'list';
  });
  const viewMode: 'list' | 'grid' = isMobile ? 'grid' : viewModeRaw;
  useEffect(() => {
    if (!isMobile) localStorage.setItem('lobby_view_mode', viewModeRaw);
  }, [viewModeRaw, isMobile]);
  // 서버에서 방 목록 가져오기 (5초마다 갱신)
  useEffect(() => {
    if (connected) {
      send({ type: 'GET_ROOMS' });
      const t = setInterval(() => send({ type: 'GET_ROOMS' }), 5000);
      return () => clearInterval(t);
    }
  }, [connected, send]);

  // V3 Task 4 Phase A: URL ?invite=TOKEN 감지 → USE_HEADSUP_INVITE 전송
  useEffect(() => {
    if (!connected) return;
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('invite');
      if (token && token.length === 8) {
        console.log(`[INVITE] Detected invite token: ${token}`);
        send({ type: 'USE_HEADSUP_INVITE', token } as any);
        // URL 에서 invite 쿼리 제거 (새로고침 시 중복 사용 방지)
        url.searchParams.delete('invite');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, [connected, send]);

  // V3 Task 4 Phase A: 초대 사용 성공 시 해당 방으로 이동
  // V22: 텔레그램 초대 전송 결과 토스트 표시
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      const err = state.lastError;
      if (err?.code === 'TELEGRAM_BATCH') {
        // 성공/실패 분리 토스트
        const lines = err.message.split('\n');
        for (const line of lines) {
          if (line.startsWith('✅')) toast.success(line, { duration: 4000 });
          else if (line.startsWith('⚠️')) toast.error(line, { duration: 6000 });
        }
        useGameStore.setState({ lastError: null });
      }
    });
    return () => unsubscribe();
  }, []);

  // V3 Task 4 Phase B: 방 생성 완료 시 해당 방으로 이동
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      if (state.pendingInviteJoin) {
        const roomId = state.pendingInviteJoin;
        useGameStore.setState({ pendingInviteJoin: null });
        navigate(`/table/${roomId}`);
      }
      if (state.pendingRoomCreated) {
        const { roomId } = state.pendingRoomCreated;
        // V22: 방 생성 완료 즉시 방 코드 세팅 (GameTable 에서 바로 모달 표시 가능)
        const code = roomId.replace(/-/g, '').slice(0, 8).toUpperCase();
        useGameStore.setState({
          pendingRoomCreated: null,
          headsupInvite: {
            token: code,
            url: '',
            expiresAt: Date.now() + 86400000,
            createdAt: Date.now(),
          },
        });
        toast.success(t('lobby.roomCreated'));
        navigate(`/table/${roomId}`);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 서버 방 목록 → 로컬 형식 변환 (서버 연결 시 서버 데이터 사용, 아니면 mock)
  const allRooms: PokerRoom[] = serverRooms.length > 0
    ? serverRooms.map(r => ({
        id: r.id,
        name: r.name,
        smallBlind: r.smallBlind / 100,
        bigBlind: r.bigBlind / 100,
        currentPlayers: r.playerCount,
        maxPlayers: r.maxPlayers,
        minBuyIn: r.minBuyIn / 100,
        maxBuyIn: (r.minBuyIn * 2) / 100,
        status: r.phase === "WAITING" ? "waiting" as const : "playing" as const,
        variant: "NL",
      }))
    : mockRooms;

  // V22: 비공개 방 표시는 유지 (🔒 아이콘), 클릭 입장은 handleJoinTable 에서 차단
  const rooms = allRooms.filter(r => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Beginner') return r.name.includes('Beginner');
    if (activeCategory === 'Standard') return r.name.includes('Standard');
    if (activeCategory === 'High Roller') return r.name.includes('High') || r.name.includes('VIP');
    if (activeCategory === 'Heads-Up') return r.maxPlayers === 2 || r.name.includes('HU');
    if (activeCategory === 'Tournament') return false; // 토너먼트는 별도 섹션
    return true;
  });

  // onlineCount는 serverRooms에서 실시간 계산 — 시뮬레이션 불필요

  // ★ 방 클릭 시 관전 모드 진입. V22: 비공개 방은 클릭 차단 → 방 코드로만 입장
  const handleJoinTable = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    const serverRoom = serverRooms.find(r => r.id === roomId);
    // V22: 비공개 방은 클릭 입장 차단 (방 코드 입력창으로만 입장 가능)
    if (serverRoom && (serverRoom as any).isPrivate) {
      toast.error('🔒 비공개 방 — 방 코드로만 입장 가능합니다', { duration: 3000 });
      return;
    }
    navigate(`/table/${roomId}`);
    toast(`👁 ${room.name} ${t('lobby.spectateEnter')}`, { duration: 1500 });
  };

  const handleCreateRoom = (config: RoomConfig) => {
    // 서버에 방 생성 요청 (서버 연결 시)
    if (connected) {
      send({ type: 'CREATE_ROOM' as any, config } as any);
      // V3 Task 4 Phase D: 방 생성 후 GameTable 에서 자동 초대 모달 오픈
      useGameStore.setState({ autoOpenInvite: true });
      // V22 bugfix: 본인이 만든 비번방 자동 입장 시 비번 자동 첨부 (INVALID_PASSWORD 방지)
      if (config.password) {
        useGameStore.setState({ pendingJoinPassword: config.password });
      }
    }
    toast.success(`"${config.name}" · 친구 초대 준비 중...`);
  };

  // V22: 방 코드(roomId 앞 8자)로 직접 입장 — 서버의 JOIN_BY_CODE 사용
  // 성공 응답 시 pendingInviteJoin 설정 → 기존 네비게이션 로직 재사용
  const handleJoinByCode = () => {
    const code = joinByCodeInput.trim().toLowerCase();
    if (code.length !== 8 || !/^[a-f0-9]{8}$/.test(code)) {
      toast.error('방 코드는 8자리 영숫자(0-9, a-f)입니다');
      return;
    }
    if (!connected) {
      toast.error('서버 연결 대기 중...');
      return;
    }
    // 기존 pending 상태 초기화
    useGameStore.setState({ pendingInviteJoin: null, lastError: null });
    send({ type: 'JOIN_BY_CODE', code } as any);
    setJoinByCodeInput('');
    toast.loading('방 찾는 중...', { id: 'join-by-code' });

    // 3초 타임아웃 — 성공 응답 없으면 실패 토스트
    setTimeout(() => {
      toast.dismiss('join-by-code');
      const st = useGameStore.getState();
      if (st.pendingInviteJoin) return;
      const err = st.lastError;
      toast.error(`❌ ${err?.message || '방 코드 확인 실패 — 올바른 코드인지 확인해주세요'}`, { duration: 4000 });
    }, 3000);
  };

  return (
    <div className="min-h-screen">

      {/* ═══════ 내 정보 플로팅 FAB — GG 포커 스타일 상단 고정 ═══════ */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowProfilePanel(true)}
        className="fixed top-3 right-3 sm:top-4 sm:right-5 z-[100] flex items-center gap-2 sm:gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full"
        style={{
          background: "rgba(14,17,25,0.92)",
          border: "1px solid rgba(255,215,0,0.3)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>
        <img src={AVATAR_IMAGES[currentAvatar] ?? AVATAR_IMAGES[0]}
          alt="me"
          className="w-8 h-8 rounded-full object-cover"
          style={{ boxShadow: "0 0 0 2px rgba(255,215,0,0.4)" }} />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-bold text-white/90 hidden sm:inline">
            {embedUser?.nickname || 'Player'}
          </span>
          <span className="text-[11px] text-[#FFD700] font-mono font-black">
            {formatMoney(embedUser?.balance ?? 0)}
          </span>
        </div>
      </motion.button>

      {/* BGM 선곡 드롭다운 (헤더 버튼에서 열림) */}
      <AnimatePresence>
        {showBGMPicker && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            className="fixed z-[200] rounded-xl p-2 min-w-[180px]"
            style={{
              top: 52, right: 16,
              background: "rgba(14,17,25,0.97)",
              border: "1px solid rgba(255,107,53,0.25)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            }}>
            <div className="text-[9px] font-bold text-[#6B7A90] uppercase tracking-wider px-2 py-1">Lobby Music</div>
            {LOBBY_BGM_TRACKS.map(track => {
              const isActive = selectedLobbyTrack === track.id;
              return (
                <button key={track.id}
                  onClick={() => { handleLobbyTrackChange(track.id); setShowBGMPicker(false); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2"
                  style={{
                    background: isActive ? "rgba(255,107,53,0.15)" : "transparent",
                    color: isActive ? "#FF6B35" : "#8899AB",
                  }}>
                  {isActive && <span className="text-[8px]">&#9654;</span>}
                  <span>{track.name}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ CINEMATIC HERO — 짤림 방지 최소 높이 ═══════ */}
      <section className="relative mx-3 sm:mx-5 mt-3 rounded-2xl overflow-hidden"
        style={{ minHeight: 220, height: "clamp(220px, 28vh, 300px)" }}>
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="/brand/og-banner.png"
            alt="TETHER.BET Holdem" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0"
            style={{
              background: `
                linear-gradient(110deg, rgba(5,8,12,0.97) 0%, rgba(5,8,12,0.8) 35%, rgba(5,8,12,0.4) 60%, transparent 100%),
                linear-gradient(0deg, rgba(5,8,12,0.6) 0%, transparent 40%)
              `,
            }} />
        </div>

        {/* Accent light leak */}
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 30%, rgba(255,107,53,0.06), transparent 60%)" }} />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end px-5 sm:px-8 pb-5">
          {/* Live indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.12)" }}>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#34D399]"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }} />
              <span className="text-[9px] text-[#34D399] font-bold uppercase tracking-wider">Live</span>
            </div>
            <span className="text-[10px] text-[#4A5A70] font-mono">
              <motion.span key={onlineCount}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}>
                {onlineCount.toLocaleString()}
              </motion.span>
              {" "}players online
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white mb-1"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
            TETHER Hold'em
          </h1>
          <p className="text-[#6B7A90] text-xs sm:text-sm mb-4 max-w-sm">
            Premium USDT Poker — Start playing now
          </p>

          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => {
                const firstAvailable = rooms.find(r => r.status !== 'playing' || r.currentPlayers < r.maxPlayers);
                const target = firstAvailable || rooms[0];
                if (target) {
                  navigate(`/table/${target.id}`);
                } else {
                  toast.error(t('lobby.noRoomsAvailable'));
                }
              }}
              className="shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5"
              style={{
                background: "linear-gradient(135deg, #FF6B35, #E85D2C)",
                boxShadow: "0 4px 20px rgba(255,107,53,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}>
              <Play className="h-3.5 w-3.5" fill="white" />
              {t('lobby.quickPlay')}
            </motion.button>
            <Link to="/tournaments" className="shrink-0">
              <button className="whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#8899AB] inline-flex items-center gap-1.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(8px)",
                }}>
                <Trophy className="h-3.5 w-3.5" />
                {t('lobby.tournament')}
              </button>
            </Link>
            <Link to="/game-manual" className="shrink-0">
              <button className="whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#8899AB] inline-flex items-center gap-1.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(8px)",
                }}>
                📖 {t('lobby.gameManual')}
              </button>
            </Link>
            <Link to="/tournament-manual" className="shrink-0">
              <button className="whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#8899AB] inline-flex items-center gap-1.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(8px)",
                }}>
                🏆 {t('lobby.tournamentManual')}
              </button>
            </Link>
            <Link to="/missions" className="shrink-0">
              <button className="whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#FF6B35] inline-flex items-center gap-1.5"
                style={{
                  background: "rgba(255,107,53,0.08)",
                  border: "1px solid rgba(255,107,53,0.15)",
                  backdropFilter: "blur(8px)",
                }}>
                🎯 Missions
              </button>
            </Link>
            <Link to="/leaderboard" className="shrink-0">
              <button className="whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#FFD700] inline-flex items-center gap-1.5"
                style={{
                  background: "rgba(255,215,0,0.08)",
                  border: "1px solid rgba(255,215,0,0.15)",
                  backdropFilter: "blur(8px)",
                }}>
                🏅 Leaderboard
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ V22: 방 코드로 빠른 입장 (친구 초대 수신자용) ═══════ */}
      <section className="mx-3 sm:mx-5 mt-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(34,211,238,0.04))", border: "1px solid rgba(34,211,238,0.2)" }}>
          <span className="text-[11px] font-bold text-[#22D3EE] shrink-0">🔑 방 코드</span>
          <input
            type="text"
            value={joinByCodeInput}
            onChange={e => setJoinByCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
            onKeyDown={e => { if (e.key === 'Enter' && joinByCodeInput.length === 8) handleJoinByCode(); }}
            placeholder="친구 초대로 받은 8자리 코드"
            className="flex-1 bg-transparent text-[12px] font-mono text-white placeholder:text-[#4A5A70] focus:outline-none tracking-wider"
            maxLength={8}
          />
          <button
            onClick={handleJoinByCode}
            disabled={joinByCodeInput.length !== 8}
            className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-black disabled:opacity-30 transition-all"
            style={{
              background: joinByCodeInput.length === 8 ? "linear-gradient(135deg, #22D3EE, #0891B2)" : "rgba(255,255,255,0.05)",
              color: joinByCodeInput.length === 8 ? "#FFFFFF" : "#4A5A70",
            }}
          >
            입장
          </button>
        </div>
      </section>

      {/* ═══════ Telegram 채널 구독 배너 (P1) ═══════ */}
      <section className="mx-3 sm:mx-5 mt-2">
        <a
          href="https://t.me/+EvLlkdY7mAFkMjdl"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl group transition-all hover:scale-[1.01]"
          style={{
            background: "linear-gradient(135deg, rgba(0,136,204,0.12), rgba(0,136,204,0.04))",
            border: "1px solid rgba(0,136,204,0.25)",
          }}
        >
          <span className="text-base shrink-0">📢</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-[#0088CC] leading-tight">
              텔레그램 채널 구독 · 새 방 오픈 즉시 알림
            </div>
            <div className="text-[9px] text-[#6B7A90] leading-tight mt-0.5">
              VIP 테이블 · 이벤트 공지도 먼저 받아보세요
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-black text-white"
            style={{ background: "linear-gradient(135deg, #0088CC, #0066AA)" }}>
            JOIN
          </span>
        </a>
      </section>

      {/* ═══════ STATS TICKER ═══════ */}
      <section className="mx-3 sm:mx-5 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { label: "ONLINE", value: onlineCount.toLocaleString(), icon: Users, color: "#34D399" },
            { label: "TABLES", value: serverRooms.length.toLocaleString(), icon: Activity, color: "#A78BFA" },
            { label: "ACTIVE", value: serverRooms.filter(r => r.playerCount > 0).length.toString(), icon: Trophy, color: "#E5B800" },
            { label: "FULL", value: serverRooms.filter(r => r.playerCount >= r.maxPlayers).length.toString(), icon: Zap, color: "#22D3EE" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.02)",
                backdropFilter: "blur(4px)",
              }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `${s.color}08` }}>
                <s.icon className="h-3 w-3" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-[7px] text-[#3D4F65] font-bold uppercase tracking-[0.15em]">{s.label}</div>
                <div className="text-[11px] font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FILTER TABS — Clean & Large ═══════ */}
      <section className="mx-3 sm:mx-5 mt-5">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {holdemCategories.map((cat) => {
            const isActive = activeCategory === cat.label;
            return (
              <button key={cat.label} onClick={() => {
                if (cat.label === 'Tournament') {
                  navigate('/tournaments');
                } else {
                  setActiveCategory(cat.label);
                }
              }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all
                  ${isActive
                    ? 'text-white'
                    : 'text-[#5A6A80] hover:text-white'
                  }`}
                style={{
                  background: isActive ? `${cat.color}15` : "rgba(255,255,255,0.02)",
                  border: isActive ? `1px solid ${cat.color}30` : "1px solid rgba(255,255,255,0.04)",
                  color: isActive ? cat.color : undefined,
                }}>
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════ TOURNAMENT COMING SOON ═══════ */}
      {/* Tournament 카테고리 클릭 시 즉시 /tournaments 로 navigate (위 onClick 핸들러에서 처리)
          → 카테고리 탭 자체가 트리거. 죽은 "COMING SOON" 섹션 제거 (2026-04-24) */}

      {/* ═══════ ROOM LIST (Tournament 제외) ═══════ */}
      {activeCategory !== 'Tournament' && (
      <section className="mx-3 sm:mx-5 mt-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">{t('lobby.title')}</h2>
            <p className="text-xs text-[#4A5A70] mt-0.5">{t('lobby.tablesAvailable', { count: rooms.length })}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* 🌐 언어 선택 */}
            <div className="relative">
              <button onClick={() => setShowLangPicker((p: boolean) => !p)}
                className="p-1.5 rounded-lg text-[11px] font-bold"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#8899AB",
                }}>
                {SUPPORTED_LOCALES.find(l => l.code === locale)?.flag || '🌐'}
              </button>
              {showLangPicker && (
                <div className="absolute top-full right-0 mt-1 z-[200] rounded-lg p-1 min-w-[130px]"
                  style={{ background: "rgba(14,17,25,0.97)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
                  {SUPPORTED_LOCALES.map(l => (
                    <button key={l.code}
                      onClick={() => { setLocale(l.code as LocaleCode); setShowLangPicker(false); }}
                      className="w-full text-left px-2 py-1.5 rounded text-[11px] font-medium flex items-center gap-2 transition-colors"
                      style={{
                        background: locale === l.code ? "rgba(255,107,53,0.15)" : "transparent",
                        color: locale === l.code ? "#FF6B35" : "#8899AB",
                      }}>
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* BGM 토글 + 선곡 — 헤더 배치 */}
            <div className="flex items-center rounded-lg p-0.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={toggleLobbyBGM}
                className="p-1.5 rounded transition-colors"
                style={{
                  background: lobbyBGMActive ? 'rgba(255,107,53,0.15)' : 'transparent',
                  color: lobbyBGMActive ? '#FF6B35' : '#6B7A90',
                }}
                title={lobbyBGMActive ? "BGM 끄기" : "BGM 켜기"}>
                {lobbyBGMActive ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => setShowBGMPicker(p => !p)}
                className="p-1.5 rounded transition-colors"
                style={{
                  background: showBGMPicker ? 'rgba(167,139,250,0.15)' : 'transparent',
                  color: showBGMPicker ? '#A78BFA' : '#6B7A90',
                }}
                title="음악 선택">
                <Music className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* View mode toggle */}
            <div className="flex items-center rounded-lg p-0.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => setViewMode('list')}
                className="p-1.5 rounded transition-colors"
                style={{
                  background: viewMode === 'list' ? 'rgba(255,107,53,0.15)' : 'transparent',
                  color: viewMode === 'list' ? '#FF6B35' : '#6B7A90',
                }}
                title="리스트 보기">
                <List className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setViewMode('grid')}
                className="p-1.5 rounded transition-colors"
                style={{
                  background: viewMode === 'grid' ? 'rgba(255,107,53,0.15)' : 'transparent',
                  color: viewMode === 'grid' ? '#FF6B35' : '#6B7A90',
                }}
                title="카드 보기">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            <motion.button whileTap={{ scale: 0.94 }}
              onClick={() => setShowCreateRoom(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
              style={{
                color: "#FF6B35",
                background: "rgba(255,107,53,0.08)",
                border: "1px solid rgba(255,107,53,0.15)",
              }}>
              <Plus className="h-3.5 w-3.5" /> Create
            </motion.button>
          </div>
        </div>

        {/* ════ LIST VIEW (GG 포커 스타일) ════ */}
        {viewMode === 'list' && (
          <div className="rounded-xl overflow-hidden"
            style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
            {/* 헤더 */}
            <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.7fr_0.7fr] gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#4A5A70]"
              style={{ background: "rgba(0,0,0,0.25)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div>테이블</div>
              <div className="text-right">블라인드</div>
              <div className="text-right">바이인</div>
              <div className="text-center">플레이어</div>
              <div className="text-right">액션</div>
            </div>
            {rooms.map((room, idx) => {
              const isFull = room.currentPlayers >= room.maxPlayers;
              const fill = room.currentPlayers / room.maxPlayers;
              const variant = room.maxPlayers === 2 ? 'HU' : room.maxPlayers === 6 ? '6-Max' : 'Full Ring';
              return (
                <motion.div key={room.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => !isFull && handleJoinTable(room.id)}
                  className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.7fr_0.7fr] gap-2 px-3 py-2.5 text-xs items-center cursor-pointer hover:bg-white/[0.03] transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1 h-8 rounded-full shrink-0"
                      style={{ background: room.status === 'playing' ? '#34D399' : '#4A5A70' }} />
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{room.name}</div>
                      <div className="text-[10px] text-[#6B7A90] flex items-center gap-1.5">
                        <span>{variant}</span>
                        {room.status === 'playing' && <span className="text-[#34D399]">● LIVE</span>}
                        {(room as any).spectatorCount > 0 && (
                          <span className="text-[#60A5FA]">👁 {(room as any).spectatorCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[#34D399]">{formatMoney(room.smallBlind)}</span>
                    <span className="text-[#4A5A70]">/</span>
                    <span className="text-[#34D399]">{formatMoney(room.bigBlind)}</span>
                  </div>
                  <div className="text-right font-mono text-[#FF6B35] font-bold">
                    {formatMoney(room.minBuyIn)}
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(room.maxPlayers, 9) }).map((_, i) => (
                          <div key={i} style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: i < room.currentPlayers
                              ? (fill > 0.8 ? "#EF4444" : "#26A17B")
                              : "rgba(255,255,255,0.08)",
                          }} />
                        ))}
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: fill > 0.8 ? "#EF4444" : "#8899AB" }}>
                        {room.currentPlayers}/{room.maxPlayers}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      disabled={isFull}
                      onClick={(e) => { e.stopPropagation(); !isFull && handleJoinTable(room.id); }}
                      className="px-3 py-1 rounded-md text-[10px] font-bold transition-all"
                      style={{
                        background: isFull ? "rgba(255,255,255,0.02)" : "linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,107,53,0.08))",
                        color: isFull ? "#2A3A50" : "#FF6B35",
                        border: `1px solid ${isFull ? "rgba(255,255,255,0.03)" : "rgba(255,107,53,0.3)"}`,
                      }}>
                      {isFull ? t('lobby.full').toUpperCase() : t('lobby.join').toUpperCase()}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ════ GRID VIEW (카드형) ════ */}
        {viewMode === 'grid' && (
        <div className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => {
            const isFull = room.currentPlayers >= room.maxPlayers;
            const fill = room.currentPlayers / room.maxPlayers;
            return (
              <motion.div key={room.id}
                whileHover={{ y: -3, scale: 1.01 }}
                className="rounded-lg sm:rounded-xl p-2.5 sm:p-5 transition-all cursor-pointer group"
                style={{
                  background: "#141820",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
                onClick={() => !isFull && handleJoinTable(room.id)}>

                <div className="flex items-start justify-between mb-2 sm:mb-3 gap-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 mb-0.5 sm:mb-1.5 flex-wrap">
                      <h3 className="text-xs sm:text-xl font-black text-white truncate">{room.name}</h3>
                      {(room as any).isPrivate && (
                        <span className="text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold flex items-center gap-1"
                          style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)", color: "#FFD700" }}>
                          🔒
                        </span>
                      )}
                      {room.status === "playing" && (
                        <span className="text-[8px] sm:text-xs px-1 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold text-emerald-400"
                          style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.15)" }}>
                          ●
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] sm:text-lg text-[#8899AB] font-mono font-bold truncate">
                      <span className="text-[#34D399]">{formatMoney(room.smallBlind)}</span>/<span className="text-[#34D399]">{formatMoney(room.bigBlind)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[8px] sm:text-xs text-[#6B7A90] mb-0.5 font-semibold hidden sm:block">Buy-in</div>
                    <div className="text-[10px] sm:text-xl font-mono font-black text-[#FF6B35]">
                      {formatMoney(room.minBuyIn)}
                    </div>
                  </div>
                </div>

                {/* Player count + fill bar */}
                <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                  <div className="flex items-center gap-1 sm:gap-2.5">
                    <div className="hidden sm:flex gap-1">
                      {Array.from({ length: room.maxPlayers }).map((_, i) => (
                        <div key={i} style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: i < room.currentPlayers
                            ? (fill > 0.8 ? "#EF4444" : "#26A17B")
                            : "rgba(255,255,255,0.06)",
                          boxShadow: i < room.currentPlayers ? `0 0 4px ${fill > 0.8 ? "rgba(239,68,68,0.3)" : "rgba(38,161,123,0.2)"}` : "none",
                        }} />
                      ))}
                    </div>
                    <span className="text-[10px] sm:text-sm font-bold"
                      style={{ color: fill > 0.8 ? "#EF4444" : "#8899AB" }}>
                      {room.currentPlayers}/{room.maxPlayers}
                    </span>
                  </div>
                </div>

                {/* Fill bar */}
                <div className="w-full h-1 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${fill * 100}%` }}
                    style={{
                      background: fill > 0.8
                        ? "linear-gradient(90deg, #EF4444, #DC2626)"
                        : "linear-gradient(90deg, #26A17B, #1A8B64)",
                    }} />
                </div>

                {/* Join button */}
                <motion.button whileTap={{ scale: 0.96 }}
                  disabled={isFull}
                  className="w-full py-1.5 sm:py-2.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all mt-2 sm:mt-3"
                  style={{
                    background: isFull ? "rgba(255,255,255,0.02)" : "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,107,53,0.05))",
                    border: `1px solid ${isFull ? "rgba(255,255,255,0.03)" : "rgba(255,107,53,0.15)"}`,
                    color: isFull ? "#2A3A50" : "#FF6B35",
                    cursor: isFull ? "not-allowed" : "pointer",
                    opacity: isFull ? 0.5 : 1,
                  }}
                  onClick={(e) => { e.stopPropagation(); !isFull && handleJoinTable(room.id); }}>
                  {isFull ? t('lobby.full') : t('lobby.join')}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
        )}

      </section>
      )}

      {/* ═══════ TOURNAMENT SECTION ═══════ */}
      <section className="mx-3 sm:mx-5 mt-6 mb-6">
        {/* ═══════ TOURNAMENT CTA ═══════ */}
        <div className="mt-8 rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(229,184,0,0.04) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 50%, rgba(255,107,53,0.03) 0%, transparent 50%),
              rgba(255,255,255,0.01)
            `,
            border: "1px solid rgba(229,184,0,0.06)",
          }}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(229,184,0,0.03), transparent 70%)" }} />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(229,184,0,0.08)", border: "1px solid rgba(229,184,0,0.1)" }}>
                  <Trophy className="h-3.5 w-3.5 text-[#E5B800]" />
                </div>
                <span className="text-[9px] text-[#E5B800] font-bold uppercase tracking-[0.15em]">Featured Tournament</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1">Weekend Championship</h3>
              <p className="text-xs text-[#5A6A80] mb-2">$50,000 USDT Guaranteed Prize Pool</p>
              <div className="flex items-center gap-4 text-[10px] text-[#4A5A70]">
                <span>📅 Apr 12, 18:00</span>
                <span>👥 234 registered</span>
                <span>🏆 Buy-in $100</span>
              </div>
            </div>
            <Link to="/tournaments">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold shrink-0"
                style={{
                  background: "linear-gradient(135deg, #E5B800, #CC9F00)",
                  color: "#1A1A2E",
                  boxShadow: "0 4px 16px rgba(229,184,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}>
                Tournaments
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      <CreateRoomModal open={showCreateRoom} onClose={() => setShowCreateRoom(false)} onCreateRoom={handleCreateRoom} />

      {/* ═══════ 내 정보 패널 — V22 Phase 2+ 반응형 fix ═══════
          - 모바일: 화면 거의 풀폭, dvh 기반 max-h
          - 태블릿(md): max-w-lg
          - 데스크탑(lg+): max-w-xl, 좌우 dead space 줄임
          - 본문 스크롤 분리 (헤더는 sticky, 본문만 overflow-y-auto)
          - safe-area-inset-top/bottom 반영 (notch 회피) */}
      <AnimatePresence>
        {showProfilePanel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowProfilePanel(false)}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md md:max-w-lg lg:max-w-xl rounded-2xl flex flex-col overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #141820, #0B0E14)",
                border: "1px solid rgba(255,215,0,0.2)",
                maxHeight: 'min(92dvh, calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 24px))',
              }}>
              {/* 헤더 — shrink-0 (sticky 효과) */}
              <div className="relative p-5 pb-3 shrink-0" style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,215,0,0.05))" }}>
                <button onClick={() => setShowProfilePanel(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-[#6B7A90] hover:text-white"
                  style={{ background: "rgba(255,255,255,0.05)" }}>✕</button>
                <div className="flex items-center gap-4">
                  <img src={AVATAR_IMAGES[pendingAvatar ?? currentAvatar] ?? AVATAR_IMAGES[0]}
                    alt="me"
                    className="w-20 h-20 rounded-full object-cover"
                    style={{ boxShadow: "0 0 0 3px rgba(255,215,0,0.3)" }} />
                  <div className="flex-1 min-w-0">
                    {/* 닉네임 — 편집 가능 */}
                    {editingNickname ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={pendingNickname}
                          onChange={(e) => setPendingNickname(e.target.value.slice(0, 20))}
                          autoFocus
                          maxLength={20}
                          placeholder="Nickname"
                          className="flex-1 min-w-0 bg-[#0a0b10] border border-[#FFD700]/40 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none focus:border-[#FFD700]"
                        />
                        <button
                          onClick={() => {
                            const n = pendingNickname.trim();
                            if (n.length >= 2) {
                              try {
                                localStorage.setItem('holdem_nickname', n);
                                toast.success(t('profile.nicknameSaved'));
                              } catch {}
                            }
                            setEditingNickname(false);
                          }}
                          className="text-[10px] font-bold text-[#0a0b10] bg-[#FFD700] px-2 py-1 rounded">
                          ✓
                        </button>
                        <button
                          onClick={() => { setEditingNickname(false); setPendingNickname(''); }}
                          className="text-[10px] font-bold text-[#6B7A90] px-2 py-1">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-black text-white truncate">
                          {(() => {
                            try { return localStorage.getItem('holdem_nickname') || embedUser?.nickname || 'Player' }
                            catch { return embedUser?.nickname || 'Player' }
                          })()}
                        </div>
                        <button
                          onClick={() => {
                            const cur = (() => { try { return localStorage.getItem('holdem_nickname') || embedUser?.nickname || ''} catch { return '' } })();
                            setPendingNickname(cur);
                            setEditingNickname(true);
                          }}
                          className="text-[10px] text-[#FFD700]/70 hover:text-[#FFD700]"
                          title="닉네임 수정">
                          ✏️
                        </button>
                      </div>
                    )}
                    <div className="text-xs text-[#6B7A90]">{embedUser?.userId?.slice(0, 8) || 'Guest'}</div>
                    <div className="text-[#FFD700] font-mono text-sm font-bold mt-1">
                      {formatMoney(embedUser?.balance ?? 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 빠른 통계 */}
              {/* 본문 스크롤 영역 — 헤더/푸터 제외, V22 Phase 2+ 반응형 */}
              <div className="flex-1 min-h-0 overflow-y-auto" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
              <div className="grid grid-cols-4 gap-2 px-5 py-4 border-y border-white/5">
                {[
                  { label: 'Hands', value: localStatsTotal.toLocaleString(), color: '#FF6B35' },
                  { label: 'Won', value: localStatsWon.toLocaleString(), color: '#34D399' },
                  { label: 'Win %', value: `${localStatsWinRate}%`, color: '#22D3EE' },
                  { label: 'Net', value: `${localStatsNet >= 0 ? '+' : ''}${Math.round(localStatsNet / 100).toLocaleString()}`, color: localStatsNet >= 0 ? '#34D399' : '#EF4444' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-[9px] text-[#4A5A70] uppercase tracking-wider">{s.label}</div>
                    <div className="text-sm font-black font-mono mt-0.5" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* 아바타 선택 */}
              <div className="px-5 py-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold text-[#6B7A90] uppercase tracking-wider">Change Avatar</div>
                  {pendingAvatar !== null && pendingAvatar !== currentAvatar && (
                    <span className="text-[9px] text-[#FFD700]">{t('profile.pendingChanges')}</span>
                  )}
                </div>
                <div className="grid grid-cols-8 gap-1.5 max-h-32 overflow-y-auto mb-3">
                  {AVATAR_IMAGES.map((src, i) => {
                    const selected = (pendingAvatar ?? currentAvatar) === i;
                    return (
                      <button key={i}
                        onClick={() => setPendingAvatar(i)}
                        className="w-full aspect-square rounded-full overflow-hidden transition-all no-touch-min"
                        style={{
                          boxShadow: selected
                            ? "0 0 0 2px #FFD700, 0 0 12px rgba(255,215,0,0.4)"
                            : "0 0 0 1px rgba(255,255,255,0.05)",
                          opacity: selected ? 1 : 0.6,
                        }}>
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
                {/* 저장/취소 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingAvatar(null)}
                    disabled={pendingAvatar === null || pendingAvatar === currentAvatar}
                    className="flex-1 py-2 rounded-lg text-[11px] font-bold disabled:opacity-30"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: "#8899AB",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                    Cancel
                  </button>
                  <button
                    disabled={pendingAvatar === null || pendingAvatar === currentAvatar}
                    onClick={() => {
                      if (pendingAvatar !== null) {
                        setAvatar(pendingAvatar);
                        toast.success(t('profile.avatarSaved'));
                        setPendingAvatar(null);
                      }
                    }}
                    className="flex-1 py-2 rounded-lg text-[11px] font-black disabled:opacity-30"
                    style={{
                      background: pendingAvatar !== null && pendingAvatar !== currentAvatar
                        ? "linear-gradient(135deg, #FFD700, #E5A500)"
                        : "rgba(255,255,255,0.03)",
                      color: pendingAvatar !== null && pendingAvatar !== currentAvatar ? "#0A0B10" : "#3A4A5A",
                    }}>
                    💾 {t('common.save')}
                  </button>
                </div>
              </div>

              {/* 🌍 Country (V22+: SettingsModal 과 동일 — CountryPicker 컴포넌트) */}
              <div className="px-5 py-4 border-b border-white/5">
                <CountryPicker
                  value={countryCode}
                  onChange={(code) => {
                    setCountryCode(code);
                    if (connected) {
                      send({ type: 'UPDATE_COUNTRY', countryCode: code } as any);
                      toast.success(code ? `🌍 국가 → ${code}` : '🌍 국가 미선택');
                    }
                  }}
                  label={
                    <span className="flex items-center gap-2">
                      <span>🌍 Country · 국가</span>
                      <span className="text-[#4A5A70] normal-case tracking-normal text-[10px]">
                        (아바타 옆 국기로 표시)
                      </span>
                    </span>
                  }
                  columns={6}
                  maxHeight={140}
                />
              </div>

              {/* 🎨 Table Felt — V22 Phase 2+: ProfilePanel 안에 직접 노출 */}
              <div className="px-5 py-4 border-b border-white/5">
                <div className="text-[10px] font-bold text-[#6B7A90] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>🎨 TABLE FELT · 테이블 색상</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(TABLE_FELTS).map(([id, felt]) => {
                    const idNum = Number(id);
                    const selected = tableFelt === idNum;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          setTableFelt(idNum);
                          toast.success(`테이블 색상: ${felt.name}`);
                        }}
                        className="p-2.5 rounded-xl text-center transition-all no-touch-min"
                        style={{
                          background: selected ? "rgba(255,107,53,0.10)" : "rgba(255,255,255,0.02)",
                          border: selected ? "1px solid rgba(255,107,53,0.40)" : "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        {/* 펠트 미니 프리뷰 */}
                        <div
                          className="h-12 rounded-lg mb-2"
                          style={{ background: felt.gradient, border: "1px solid rgba(255,255,255,0.10)" }}
                        />
                        <div className="text-[10px] font-bold leading-tight" style={{ color: selected ? "#FF6B35" : "#6B7A90" }}>
                          {felt.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* P3: Telegram 연동 */}
              <div className="px-5 py-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold text-[#6B7A90] uppercase tracking-wider">📱 Telegram 알림</div>
                  {tgLink.linked && (
                    <span className="text-[9px] text-[#34D399]">● 연동됨 {tgLink.username || ''}</span>
                  )}
                </div>
                {!tgLink.linked ? (
                  <>
                    <p className="text-[10px] text-[#8899AB] leading-relaxed mb-2">
                      앱을 닫아도 내 차례·승리·초대 알림을 텔레그램으로 받기
                    </p>
                    {tgLink.pendingUrl ? (
                      <>
                        <a
                          href={tgLink.pendingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 rounded-xl text-[12px] font-black text-white transition-all block text-center"
                          style={{
                            background: "linear-gradient(135deg, #0088CC, #0066AA)",
                            boxShadow: "0 4px 12px rgba(0,136,204,0.3)",
                            textDecoration: "none",
                          }}
                        >
                          📲 텔레그램 앱으로 연동하기
                        </a>
                        <p className="text-[9px] text-[#FFD700] mt-2 text-center leading-relaxed">
                          위 버튼 탭 → 텔레그램 열리면 [시작] 탭<br/>
                          완료 후 프로필 다시 열면 연동 확인
                        </p>
                      </>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl text-[12px] font-black text-white opacity-60"
                        style={{ background: "linear-gradient(135deg, #0088CC, #0066AA)" }}
                      >
                        🔄 연동 링크 생성 중...
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5 mb-2">
                      {[
                        { key: 'turn' as const, label: '⏰ 내 턴 차례 (AFK 15초+)' },
                        { key: 'win' as const, label: '🏆 승리 / 큰 팟 획득' },
                        { key: 'allIn' as const, label: '🔥 올인 상황' },
                        { key: 'invite' as const, label: '🎯 방 입장 요청 (호스트)' },
                      ].map(opt => (
                        <label key={opt.key} className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-white/[0.03]">
                          <input
                            type="checkbox"
                            checked={Boolean(tgLink.optIns?.[opt.key])}
                            onChange={e => handleOptInChange(opt.key, e.target.checked)}
                            className="w-4 h-4 accent-[#0088CC]"
                          />
                          <span className="text-[11px] text-[#8899AB] flex-1">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => { if (confirm('텔레그램 연동을 해제하시겠습니까?')) send({ type: 'LINK_TELEGRAM_UNLINK' } as any); }}
                      className="w-full py-1.5 rounded-lg text-[10px] font-bold text-[#6B7A90] transition-all hover:text-[#EF4444]"
                      style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}
                    >
                      연동 해제
                    </button>
                  </>
                )}
              </div>

              </div>{/* /본문 스크롤 영역 */}

              {/* 액션 버튼 — shrink-0 (footer sticky) */}
              <div className="grid grid-cols-2 gap-2 p-4 shrink-0 border-t border-white/5" style={{ background: 'rgba(11,14,20,0.95)' }}>
                <button onClick={() => { setShowProfilePanel(false); navigate('/profile'); }}
                  className="py-2.5 rounded-xl text-xs font-bold text-[#FF6B35]"
                  style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.25)" }}>
                  Full Profile
                </button>
                <button onClick={() => { setShowProfilePanel(false); navigate('/profile?tab=history'); }}
                  className="py-2.5 rounded-xl text-xs font-bold text-[#22D3EE]"
                  style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)" }}>
                  Hand History
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ 비밀번호 입력 모달 — 커스텀 디자인 ═══════ */}
      <AnimatePresence>
        {passwordModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPasswordModal(null)}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(180deg, #1A2030, #0F1520)", border: "1px solid rgba(255,215,0,0.15)" }}>

              {/* 헤더 */}
              <div className="p-5 pb-3 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))", border: "1px solid rgba(255,215,0,0.2)" }}>
                  <span style={{ fontSize: 28 }}>🔒</span>
                </div>
                <h3 className="text-lg font-black text-white">{passwordModal.roomName}</h3>
                <p className="text-xs text-[#6B7A90] mt-1">{t('alert.passwordRequired')}</p>
              </div>

              {/* 입력 */}
              <div className="px-5 pb-3">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && passwordInput) {
                      useGameStore.setState({ pendingJoinPassword: passwordInput });
                      navigate(`/table/${passwordModal.roomId}`);
                      setPasswordModal(null);
                    }
                  }}
                  autoFocus
                  placeholder="••••••"
                  className="w-full px-4 py-3 rounded-xl text-center text-lg font-mono tracking-[0.3em] text-white placeholder-[#3A4A5A]"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,215,0,0.2)",
                    outline: "none",
                  }}
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 px-5 pb-5">
                <button
                  onClick={() => { setPasswordModal(null); toast.error(t('alert.passwordCancelled')); }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-[#6B7A90]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => {
                    if (!passwordInput) return;
                    useGameStore.setState({ pendingJoinPassword: passwordInput });
                    navigate(`/table/${passwordModal.roomId}`);
                    setPasswordModal(null);
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-black text-white"
                  style={{
                    background: passwordInput ? "linear-gradient(135deg, #FFD700, #E5A500)" : "rgba(255,255,255,0.03)",
                    color: passwordInput ? "#0A0B10" : "#3A4A5A",
                  }}>
                  {t('common.confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}