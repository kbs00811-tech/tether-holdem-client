import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type ConnectionState = "connected" | "disconnected" | "reconnecting";

export function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionState>("connected");
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Simulate connection status for demo
    // In production, this would listen to WebSocket connection events
    const handleOnline = () => {
      setStatus("connected");
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    };

    const handleOffline = () => {
      setStatus("disconnected");
      setShow(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const config = {
    connected: {
      bg: "bg-green-500/90",
      icon: Wifi,
      text: "연결 복구됨",
    },
    disconnected: {
      bg: "bg-red-500/90",
      icon: WifiOff,
      text: "서버 연결이 끊어졌습니다. 재연결 중...",
    },
    reconnecting: {
      bg: "bg-yellow-500/90",
      icon: Wifi,
      text: "재연결 중...",
    },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={`fixed top-0 left-0 right-0 z-50 ${current.bg} px-4 py-3 text-center text-white shadow-lg`}
        >
          <div className="flex items-center justify-center gap-2">
            <Icon className="h-5 w-5" />
            <span className="font-medium">{current.text}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
