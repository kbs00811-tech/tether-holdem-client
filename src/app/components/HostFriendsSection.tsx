/**
 * P5 라이트: 호스트 친구 빠른 초대 섹션 (방식 B — 봇 정책 우회 없음)
 *
 * 호스트가 텔레그램 username 등록 → 방 생성 시 친구별 share 버튼 표시.
 * share 클릭 → t.me/{friend}?text={invite_link} 새 탭 열림 → 호스트가 직접 send.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGameStore } from "../stores/gameStore";

interface Props {
  send: (msg: any) => void;
  roomCode: string;
  roomName: string;
  deepLink: string; // https://t.me/tetherinfo_bot?start=room_XXX
}

const USERNAME_REGEX = /^@?[a-zA-Z0-9_]{5,32}$/;

export function HostFriendsSection({ send, roomCode, roomName, deepLink }: Props) {
  const friends = useGameStore(s => s.hostFriends);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);

  // 모달 열릴 때 1회 리스트 요청
  useEffect(() => {
    try { send({ type: 'HOST_FRIEND_LIST' }); } catch {}
  }, [send]);

  const handleAdd = () => {
    const v = input.trim();
    if (!USERNAME_REGEX.test(v)) {
      toast.error('텔레그램 username 형식이 잘못됨 (5~32자 영숫자/언더스코어)');
      return;
    }
    if (friends.length >= 50) {
      toast.error('최대 50명까지 등록 가능');
      return;
    }
    setAdding(true);
    try {
      send({ type: 'HOST_FRIEND_ADD', username: v });
      // 약간의 지연 후 재조회
      setTimeout(() => {
        try { send({ type: 'HOST_FRIEND_LIST' }); } catch {}
        setAdding(false);
      }, 200);
      setInput("");
    } catch {
      setAdding(false);
    }
  };

  const handleRemove = (username: string) => {
    try {
      send({ type: 'HOST_FRIEND_REMOVE', username });
      setTimeout(() => {
        try { send({ type: 'HOST_FRIEND_LIST' }); } catch {}
      }, 200);
    } catch {}
  };

  const buildShareUrl = (friendUsername: string): string => {
    const text = `🃏 ${roomName} 홀덤 초대\n방 코드: ${roomCode}\n${deepLink}`;
    return `https://t.me/${friendUsername}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="mt-3 p-3 rounded-xl"
      style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">👥</span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-[#22D3EE] leading-tight">친구 빠른 초대</div>
          <div className="text-[9px] text-[#6B7A90] leading-tight mt-0.5">
            등록한 친구에게 한 번에 초대 링크 전송 (텔레그램 앱 자동 열림)
          </div>
        </div>
      </div>

      {/* 입력 */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="텔레그램 username (예: alice)"
          maxLength={33}
          disabled={adding}
          className="flex-1 min-h-[40px] px-3 py-2 rounded-lg text-[12px] bg-black/40 text-white outline-none"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !input.trim()}
          className="min-w-[64px] min-h-[40px] px-3 rounded-lg text-[11px] font-black text-white transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
        >
          {adding ? '...' : '+ 추가'}
        </button>
      </div>

      {/* 목록 */}
      {friends.length === 0 ? (
        <div className="text-[10px] text-[#4A5A70] text-center py-2">
          등록된 친구 없음 — username 입력 후 [+ 추가]
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
          {friends.map(f => (
            <div key={f.username}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-[12px] text-white font-medium flex-1 truncate">@{f.username}</span>
              <a
                href={buildShareUrl(f.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[44px] min-h-[36px] px-2.5 rounded-md text-[10px] font-black text-white flex items-center justify-center transition-all shrink-0"
                style={{ background: "linear-gradient(135deg, #0088CC, #0066AA)", textDecoration: "none" }}
                title="텔레그램으로 초대 보내기"
              >
                📤 보내기
              </a>
              <button
                onClick={() => handleRemove(f.username)}
                aria-label="삭제"
                className="min-w-[36px] min-h-[36px] rounded-md text-[#6B7A90] hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center shrink-0"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {friends.length > 0 && (
        <div className="text-[9px] text-[#4A5A70] text-center mt-2 leading-tight">
          💡 [📤 보내기] 클릭 → 텔레그램 앱에서 친구에게 메시지 전송 화면 열림
        </div>
      )}
    </div>
  );
}
