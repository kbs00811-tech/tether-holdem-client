import { Link, useLocation } from "react-router";
import { Wallet, Bell, Menu, X, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { motion } from "motion/react";
import { useGameStore } from "../stores/gameStore";
import { useSocket } from "../hooks/useSocket";
import { SettingsModal } from "./SettingsModal";

export function Header() {
  const location = useLocation();
  const { send } = useSocket();
  const connected = useGameStore(s => s.connected);
  const balance = 12450.5;
  const [showPromo, setShowPromo] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(3);
  const [currentCardSkin, setCurrentCardSkin] = useState(1);

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

              {/* Balance */}
              <Link to="/cashier" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                <Wallet className="h-4 w-4 text-[#FF6B35]" />
                <span className="font-mono text-sm text-white font-bold">₮{balance.toLocaleString()}</span>
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

              {/* Avatar */}
              <button onClick={() => setShowSettings(true)}
                className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center overflow-hidden"
                style={{
                  boxShadow: "0 0 0 2px rgba(255,107,53,0.15)",
                }}>
                <img src={`/src/assets/avatars/${String(currentAvatar + 1).padStart(2, '0')}_${['bull','fox','penguin','ninja','shark','hacker','phoenix','wolf','astronaut','eagle'][currentAvatar]}.png`}
                  alt="avatar" className="w-full h-full object-cover" />
              </button>

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
                    <div className="text-2xl font-mono font-black text-white">₮{balance.toLocaleString()}</div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        currentAvatar={currentAvatar}
        onChangeAvatar={(id) => {
          setCurrentAvatar(id);
          send({ type: 'SET_PRE_ACTION', action: null } as any); // placeholder — 서버에 avatar 변경은 추후
        }}
        currentCardSkin={currentCardSkin}
        onChangeCardSkin={setCurrentCardSkin}
      />
    </>
  );
}
