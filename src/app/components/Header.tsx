import { Link, useLocation } from "react-router";
import { Wallet, Bell, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { motion } from "motion/react";

export function Header() {
  const location = useLocation();
  const balance = 12450.5;
  const [showPromo, setShowPromo] = useState(true);

  const navItems = [
    { label: "로비", path: "/", exact: true },
    { label: "토너먼트", path: "/tournaments" },
    { label: "캐셔", path: "/cashier" },
    { label: "프로필", path: "/profile" },
  ];

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <>
      {/* Promo — gradient ribbon */}
      {showPromo && (
        <div className="relative px-4 py-1.5 flex items-center justify-center"
          style={{
            background: "linear-gradient(90deg, #FF6B35 0%, #E85D2C 30%, #FF6B35 60%, #E85D2C 100%)",
            backgroundSize: "200% 100%",
          }}>
          <div className="flex items-center gap-1.5">
            <span className="text-white/90 text-[10px] font-medium">🎁 첫 입금 100% 보너스 · 최대 $1,000</span>
            <Link to="/cashier" className="text-white text-[10px] font-bold underline underline-offset-2 ml-1">
              지금 받기 →
            </Link>
          </div>
          <button onClick={() => setShowPromo(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Main Header — frosted glass */}
      <header className="sticky top-0 z-40"
        style={{
          background: "rgba(8,12,18,0.88)",
          backdropFilter: "blur(20px) saturate(1.3)",
          borderBottom: "1px solid rgba(255,255,255,0.03)",
        }}>
        <div className="mx-auto px-4 sm:px-6">
          <div className="flex h-12 items-center justify-between gap-3">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #FF6B35, #E85D2C)",
                  boxShadow: "0 2px 8px rgba(255,107,53,0.2)",
                }}>
                <span className="text-white font-black text-[10px]">T</span>
              </div>
              <div className="hidden sm:flex items-baseline gap-0">
                <span className="text-white font-black text-sm tracking-tight">TETHER</span>
                <span className="text-[#FF6B35] font-black text-sm">.</span>
                <span className="text-[#4A5A70] font-bold text-xs">BET</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5 relative">
              {navItems.map((item) => {
                const active = isActive(item.path, item.exact);
                return (
                  <Link key={item.path} to={item.path}>
                    <button className="relative px-3 py-1.5 rounded-lg text-[12px] transition-all"
                      style={{
                        color: active ? "#FFFFFF" : "#5A6A80",
                        background: active ? "rgba(255,255,255,0.04)" : "transparent",
                        fontWeight: active ? 600 : 400,
                      }}>
                      {item.label}
                      {active && (
                        <motion.div layoutId="nav-underline"
                          className="absolute bottom-0 left-1/2 w-4 h-[2px] rounded-full"
                          style={{ background: "#FF6B35", transform: "translateX(-50%)" }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                      )}
                    </button>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1.5">
              {/* Balance chip */}
              <Link to="/cashier" className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}>
                <Wallet className="h-3 w-3 text-[#4A5A70]" />
                <span className="font-mono text-[11px] text-white font-bold">${balance.toLocaleString()}</span>
              </Link>

              {/* Deposit */}
              <Link to="/cashier">
                <motion.button whileTap={{ scale: 0.94 }}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #FF6B35, #E85D2C)",
                    boxShadow: "0 2px 8px rgba(255,107,53,0.2)",
                  }}>입금</motion.button>
              </Link>

              {/* Notification */}
              <button className="relative w-7 h-7 rounded-lg items-center justify-center hidden sm:flex"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <Bell className="h-3.5 w-3.5 text-[#3D4F65]" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#EF4444]"
                  style={{ boxShadow: "0 0 4px rgba(239,68,68,0.4)" }} />
              </button>

              {/* Avatar */}
              <button className="hidden sm:flex w-7 h-7 rounded-full items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #FF6B35, #E5B800)",
                  boxShadow: "0 0 0 2px rgba(255,107,53,0.1)",
                }}>
                <span className="text-white text-[9px] font-black">T</span>
              </button>

              {/* Mobile burger */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="text-[#5A6A80] h-8 w-8">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent style={{ background: "rgba(11,14,20,0.98)", borderColor: "rgba(255,255,255,0.03)" }}>
                  <div className="mt-8 space-y-1">
                    {navItems.map((item) => (
                      <Link key={item.path} to={item.path}>
                        <div className="px-4 py-3 rounded-xl text-sm transition-all"
                          style={{
                            color: isActive(item.path, item.exact) ? "#FF6B35" : "#5A6A80",
                            background: isActive(item.path, item.exact) ? "rgba(255,107,53,0.06)" : "transparent",
                            fontWeight: isActive(item.path, item.exact) ? 600 : 400,
                          }}>
                          {item.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-8 p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}>
                    <div className="text-[8px] text-[#3D4F65] font-bold uppercase tracking-[0.15em] mb-1">Balance</div>
                    <div className="text-xl font-mono font-black text-white">${balance.toLocaleString()}</div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
