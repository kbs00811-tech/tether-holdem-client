import { Link, useLocation, useNavigate } from "react-router";
import { Wallet, Bell, Menu, X, Settings, User, History, LogOut, Trophy } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "../stores/gameStore";
import { useSocket } from "../hooks/useSocket";
import { SettingsModal } from "./SettingsModal";
import { useSettingsStore, AVATAR_IMAGES } from "../stores/settingsStore";
import { formatMoney, getSymbol } from "../utils/currency";
import { useEmbedMode } from "../hooks/useEmbedMode";
import { useRateStore } from "../stores/rateStore";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { send } = useSocket();
  const connected = useGameStore(s => s.connected);
  const { user: embedUser } = useEmbedMode();
  // Embed 모드에서는 호스트가 전달한 balance 사용, standalone 에서는 기본값
  const balance = embedUser?.balance ?? 0;
  const [showPromo, setShowPromo] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const currentAvatar = useSettingsStore(s => s.avatar);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!showProfileMenu) return;
    const close = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showProfileMenu]);

  const navItems = [
    { label: "Lobby", path: "/", exact: true },
    { label: "Tournaments", path: "/tournaments" },
    { label: "Cashier", path: "/cashier" },
    { label: "Profile", path: "/profile" },
  ];

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <>
      {/* Promo banner */}
      {showPromo && (
        <div className="relative px-4 py-2 flex items-center justify-center"
          style={{
            background: "linear-gradient(90deg, #FF6B35 0%, #E85D2C 40%, #FF6B35 70%, #FFD700 100%)",
            backgroundSize: "200% 100%",
          }}>
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-bold">🎁 First Deposit 100% Bonus · Up to $1,000</span>
            <Link to="/cashier" className="text-white text-xs font-black underline underline-offset-2 ml-1">
              Claim →
            </Link>
          </div>
          <button onClick={() => setShowPromo(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-40"
        style={{
          background: "rgba(8,12,18,0.92)",
          backdropFilter: "blur(24px) saturate(1.4)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}>
        <div className="mx-auto px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #FF6B35, #E85D2C)",
                  boxShadow: "0 3px 12px rgba(255,107,53,0.3)",
                }}>
                <span className="text-white font-black text-sm">T</span>
              </div>
              <div className="hidden sm:flex items-baseline gap-0">
                <span className="text-white font-black text-base tracking-tight">TETHER</span>
                <span className="text-[#FF6B35] font-black text-base">.</span>
                <span className="text-[#6B7A90] font-bold text-sm">BET</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 relative">
              {navItems.map((item) => {
                const active = isActive(item.path, item.exact);
                return (
                  <Link key={item.path} to={item.path}>
                    <button className="relative px-4 py-2 rounded-lg text-sm transition-all"
                      style={{
                        color: active ? "#FFFFFF" : "#5A6A80",
                        background: active ? "rgba(255,107,53,0.08)" : "transparent",
                        fontWeight: active ? 700 : 500,
                      }}>
                      {item.label}
                      {active && (
                        <motion.div layoutId="nav-underline"
                          className="absolute bottom-0 left-1/2 w-6 h-[2px] rounded-full"
                          style={{ background: "#FF6B35", transform: "translateX(-50%)" }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                      )}
                    </button>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Connection status */}
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-500"}`}
                style={{ boxShadow: connected ? "0 0 6px rgba(52,211,153,0.4)" : "0 0 6px rgba(239,68,68,0.4)" }} />

              {/* USDT 시세 인디케이터 (Beta-G+ 2026-04-27) — 클릭 시 통화 cycle */}
              {(() => {
                const rates = useRateStore(s => s.rates);
                const displayCurrency = useRateStore(s => s.displayCurrency);
                const cycle = useRateStore(s => s.cycleDisplayCurrency);
                const isFresh = rates.updatedAt > 0 && (Date.now() - rates.updatedAt) < 10 * 60 * 1000;
                const display = (() => {
                  switch (displayCurrency) {
                    case 'KRW': return `≈ ₩${Math.round(rates.usdtKrw).toLocaleString()}`;
                    case 'USD': return `≈ $${rates.usdtUsd.toFixed(2)}`;
                    case 'EUR': return `≈ €${rates.usdtEur.toFixed(2)}`;
                    case 'JPY': return `≈ ¥${Math.round(rates.usdtJpy)}`;
                    case 'USDT': return `(USDT mode)`;
                  }
                })();
                return (
                  <button
                    onClick={cycle}
                    className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-mono hover:bg-[#26A17B]/15 transition-colors"
                    title={`Click to cycle currency · ${isFresh ? 'Live' : 'Cached'}`}
                    style={{
                      background: 'rgba(38,161,123,0.08)',
                      border: '1px solid rgba(38,161,123,0.15)',
                    }}>
                    <span className="text-[#26A17B] font-bold">₮ 1</span>
                    <span className="text-[#8899AB]">{display}</span>
                    {isFresh && <span className="w-1 h-1 rounded-full bg-emerald-400 ml-0.5" />}
                  </button>
                );
              })()}

              {/* Balance + USDT 보조 표시 (Beta-G+ 2026-04-27) */}
              <Link to="/cashier" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl group"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                <Wallet className="h-4 w-4 text-[#FF6B35]" />
                <div className="flex flex-col items-end leading-none">
                  <span className="font-mono text-sm text-white font-bold">{getSymbol()}{balance.toLocaleString()}</span>
                  {(() => {
                    const usdtKrw = useRateStore.getState().rates.usdtKrw || 1400;
                    const usdt = balance / usdtKrw;
                    const txt = usdt >= 1000 ? `≈ ₮${(usdt/1000).toFixed(1)}K` : `≈ ₮${usdt.toFixed(2)}`;
                    return <span className="text-[8px] text-[#26A17B] mt-0.5">{txt}</span>;
                  })()}
                </div>
              </Link>

              {/* Deposit button */}
              <Link to="/cashier">
                <motion.button whileTap={{ scale: 0.94 }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #FF6B35, #E85D2C)",
                    boxShadow: "0 3px 12px rgba(255,107,53,0.25)",
                  }}>Deposit</motion.button>
              </Link>

              {/* Notification */}
              <button className="relative w-9 h-9 rounded-xl items-center justify-center hidden sm:flex"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <Bell className="h-4 w-4 text-[#4A5A70]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444]"
                  style={{ boxShadow: "0 0 4px rgba(239,68,68,0.5)" }} />
              </button>

              {/* Avatar with dropdown */}
              <div className="relative hidden sm:block" ref={profileMenuRef}>
                <button onClick={() => setShowProfileMenu(v => !v)}
                  className="flex w-9 h-9 rounded-full items-center justify-center overflow-hidden"
                  style={{
                    boxShadow: "0 0 0 2px rgba(255,107,53,0.15)",
                  }}>
                  <img src={AVATAR_IMAGES[currentAvatar] ?? AVATAR_IMAGES[0]}
                    alt="avatar" className="w-full h-full object-cover" />
                </button>
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      className="absolute right-0 top-11 w-52 rounded-xl overflow-hidden z-50"
                      style={{
                        background: "rgba(14,17,25,0.98)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                        backdropFilter: "blur(16px)",
                      }}>
                      {/* 유저 정보 헤더 */}
                      <div className="px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <img src={AVATAR_IMAGES[currentAvatar] ?? AVATAR_IMAGES[0]}
                            alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                              {embedUser?.nickname || 'Player'}
                            </div>
                            <div className="text-[10px] text-[#FF6B35] font-mono">
                              {getSymbol()}{formatMoney(balance / 100)}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 메뉴 */}
                      <div className="p-1">
                        {[
                          { icon: User, label: 'My Profile', onClick: () => { navigate('/profile'); setShowProfileMenu(false); } },
                          { icon: History, label: 'Bet History', onClick: () => { navigate('/profile?tab=history'); setShowProfileMenu(false); } },
                          { icon: Trophy, label: 'Tournaments', onClick: () => { navigate('/tournaments'); setShowProfileMenu(false); } },
                          { icon: Wallet, label: 'Cashier', onClick: () => { navigate('/cashier'); setShowProfileMenu(false); } },
                          { icon: Settings, label: 'Settings', onClick: () => { setShowSettings(true); setShowProfileMenu(false); } },
                        ].map(item => (
                          <button key={item.label}
                            onClick={item.onClick}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#8899AB] hover:text-white hover:bg-white/[0.04] transition-colors">
                            <item.icon className="h-3.5 w-3.5" />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <button className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.03)" }}>
                    <Menu className="h-5 w-5 text-[#5A6A80]" />
                  </button>
                </SheetTrigger>
                <SheetContent style={{ background: "rgba(11,14,20,0.98)", borderColor: "rgba(255,255,255,0.04)" }}>
                  <div className="mt-8 space-y-1">
                    {navItems.map((item) => (
                      <Link key={item.path} to={item.path}>
                        <div className="px-4 py-3.5 rounded-xl text-sm font-medium transition-all"
                          style={{
                            color: isActive(item.path, item.exact) ? "#FF6B35" : "#6B7A90",
                            background: isActive(item.path, item.exact) ? "rgba(255,107,53,0.06)" : "transparent",
                            fontWeight: isActive(item.path, item.exact) ? 700 : 500,
                          }}>
                          {item.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-8 p-5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="text-[10px] text-[#3D4F65] font-bold uppercase tracking-[0.15em] mb-1">Balance</div>
                    <div className="text-2xl font-mono font-black text-white">{getSymbol()}{balance.toLocaleString()}</div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
