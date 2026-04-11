import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "../stores/gameStore";
import { useSocket } from "../hooks/useSocket";

interface ChatPanelProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const quickEmojis = ["👍", "😂", "😡", "🤔", "💪", "🔥", "💀", "🎉", "😎", "🃏"];

export function ChatPanel({ open: controlledOpen, onOpenChange }: ChatPanelProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const { send } = useSocket();
  const chatMessages = useGameStore(s => s.chatMessages);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    send({ type: 'CHAT', message: inputValue.trim().slice(0, 200) });
    setInputValue("");
  };

  const handleEmoji = (emoji: string) => {
    send({ type: 'CHAT', message: emoji });
  };

  return (
    <>
      {/* Toggle */}
      <button onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: isOpen ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg, #FF6B35, #E85D2C)",
          border: isOpen ? "1px solid rgba(239,68,68,0.2)" : "none",
          boxShadow: isOpen ? "none" : "0 4px 15px rgba(255,107,53,0.3)",
        }}>
        {isOpen ? <X className="h-5 w-5 text-[#EF4444]" /> : <MessageCircle className="h-5 w-5 text-white" />}
        {!isOpen && chatMessages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[8px] font-bold flex items-center justify-center">
            {Math.min(chatMessages.length, 9)}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed right-4 bottom-20 z-40 w-80 h-[420px] rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: "rgba(15,21,32,0.97)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            }}>

            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-sm font-bold text-white">Chat</span>
              <span className="text-[10px] text-[#4A5A70]">{chatMessages.length} messages</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {chatMessages.length === 0 && (
                <div className="text-center text-[11px] text-[#3A4A5A] py-8">No messages yet</div>
              )}
              {chatMessages.map((msg, i) => {
                const isEmoji = msg.message.length <= 2 && /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(msg.message);
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ background: `hsl(${msg.nickname.charCodeAt(0) * 37 % 360}, 60%, 40%)` }}>
                      {msg.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-semibold text-[#8899AB] truncate">{msg.nickname}</span>
                        <span className="text-[8px] text-[#3A4A5A]">{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`text-[11px] ${isEmoji ? 'text-2xl' : 'text-[#C0C8D4]'}`}>
                        {msg.message}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emojis */}
            <div className="px-3 py-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
              <div className="flex gap-1.5 justify-center">
                {quickEmojis.map(e => (
                  <button key={e} onClick={() => handleEmoji(e)}
                    className="text-lg hover:scale-125 transition-transform active:scale-90">{e}</button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex gap-2">
                <input value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  maxLength={200}
                  className="flex-1 px-3 py-2 rounded-lg text-xs text-white placeholder-[#3A4A5A]
                    bg-[#0B1018] border border-[#1A2235] focus:border-[#FF6B35] focus:outline-none" />
                <button onClick={handleSend}
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: inputValue.trim() ? "linear-gradient(135deg, #FF6B35, #E85D2C)" : "rgba(255,255,255,0.03)" }}>
                  <Send className="h-3.5 w-3.5" style={{ color: inputValue.trim() ? "white" : "#3A4A5A" }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
