import { Link, useLocation } from "react-router";
import { Home, Gamepad2, Trophy, Wallet, User } from "lucide-react";
import { motion } from "motion/react";

const navItems = [
  { icon: Home, label: "로비", path: "/" },
  { icon: Gamepad2, label: "퀵플레이", path: "/table/1" },
  { icon: Trophy, label: "토너먼트", path: "/tournaments" },
  { icon: Wallet, label: "캐셔", path: "/cashier" },
  { icon: User, label: "프로필", path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(8,12,18,0.92)",
        backdropFilter: "blur(20px) saturate(1.3)",
        borderTop: "1px solid rgba(255,255,255,0.03)",
      }}>
      <div className="flex items-center justify-around py-1 pb-[max(6px,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive =
            item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative">
              <div className="relative">
                <item.icon className="h-5 w-5 transition-colors"
                  style={{ color: isActive ? "#FF6B35" : "#2A3A50" }} />
                {isActive && (
                  <motion.div layoutId="bnav-glow"
                    className="absolute -inset-1 rounded-lg -z-10"
                    style={{ background: "rgba(255,107,53,0.06)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                )}
              </div>
              <span className="text-[8px] font-medium"
                style={{ color: isActive ? "#FF6B35" : "#2A3A50" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
