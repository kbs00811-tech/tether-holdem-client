import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "motion/react";

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  isEmoji?: boolean;
}

interface ChatPanelProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const quickEmojis = ["👍", "😂", "😡", "🤔", "💪", "🔥", "💀", "🎉"];

export function ChatPanel({ open: controlledOpen, onOpenChange }: ChatPanelProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      playerId: "bot",
      playerName: "System",
      message: "Welcome to the table!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      playerId: "hero",
      playerName: "You",
      message: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
  };

  const handleEmojiClick = (emoji: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      playerId: "hero",
      playerName: "You",
      message: emoji,
      timestamp: new Date(),
      isEmoji: true,
    };

    setMessages([...messages, newMessage]);
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full shadow-lg"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </Button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed right-4 bottom-20 z-40 w-80 h-96 bg-card border border-border rounded-lg shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-foreground">채팅</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.playerId === "hero" ? "items-end" : "items-start"
                  }`}
                >
                  {msg.playerId !== "hero" && (
                    <span className="text-xs text-muted-foreground mb-1">
                      {msg.playerName}
                    </span>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      msg.playerId === "hero"
                        ? "bg-primary text-primary-foreground"
                        : msg.playerId === "bot"
                        ? "bg-muted/50 text-muted-foreground"
                        : "bg-muted text-foreground"
                    } ${msg.isEmoji ? "text-2xl p-2" : "text-sm"}`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {msg.timestamp.toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emojis */}
            <div className="px-4 py-2 border-t border-border">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="flex-shrink-0 text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="메시지 입력..."
                  className="flex-1"
                />
                <Button onClick={handleSend} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}