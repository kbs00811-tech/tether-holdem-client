import { Link, useLocation } from "react-router";
import { Home, Zap, Trophy, Wallet, User } from "lucide-react";
import { motion } from "motion/react";
import { useGameStore } from "../stores/gameStore";

const navItems = [
  { icon: Home, label: "Lobby", path: "/" },
  { icon: Zap, label: "Play", path: "/table/quick" },
  { icon: Trophy, label: "Tourney", path: "/tournaments" },
  { icon: Wallet, label: "Funds", path: "/cashier" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();
  const connected = useGameStore(s => s.connected);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(8,12,18,0.95)",
        backdropFilter: "blur(24px) saturate(1.4)",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
      <div className="flex items-center justify-around py-1.5 pb-[max(8px,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive =
            item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
          const isPlay = item.label === "Play";

          return (
            <Link key={item.path} to={item.path}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative">

              {/* Play button — special highlight */}
              {isPlay ? (
                <div className="relative">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center -mt-4"
                    style={{
                      background: "linear-gradient(135deg, #FF6B35, #E85D2C)",
                      boxShadow: "0 4px 15px rgba(255,107,53,0.35)",
                    }}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-[9px] font-bold text-[#FF6B35] mt-0.5 block text-center">{item.label}</span>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <item.icon className="h-5 w-5 transition-colors"
                      style={{ color: isActive ? "#FF6B35" : "#2A3A50" }} />
                    {isActive && (
                      <motion.div layoutId="bnav-glow"
                        className="absolute -inset-1.5 rounded-lg -z-10"
                        style={{ background: "rgba(255,107,53,0.08)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                    )}
                  </div>
                  <span className="text-[9px] font-semibold"
                    style={{ color: isActive ? "#FF6B35" : "#2A3A50" }}>
                    {item.label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
