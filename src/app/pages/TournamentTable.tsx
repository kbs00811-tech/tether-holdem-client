/**
 * Phase 1 (2026-04-24): mock 제거 + GameTable wrap + 실 토너 헤더
 * - GET_TOURNAMENT_STATE 5초 polling
 * - 토너 헤더: 레벨, 블라인드, 남은 시간, 내 랭킹·스택
 * - 게임 진행은 GameTable 그대로 사용 (분기 없음, wrapper 패턴)
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useSocket } from "../hooks/useSocket";
import { useGameStore } from "../stores/gameStore";
import GameTable from "./GameTable";
import { Trophy, Clock, Users, TrendingUp } from "lucide-react";
import { formatMoney } from "../utils/currency";

interface TournamentState {
  success?: boolean;
  tournamentId?: string;
  name?: string;
  status?: string;
  currentLevel?: number;
  currentBlind?: { sb: number; bb: number; ante?: number; durationSec?: number };
  nextLevelAt?: number;
  playersRemaining?: number;
  totalPlayers?: number;
  totalPrizePool?: number;
  myStack?: number;
  myRank?: number | null;
  myEliminated?: boolean;
  myFinishPosition?: number | null;
  avgStack?: number;
  lateRegRemainingSec?: number;
  rebuysAvailable?: number;
}

function formatBlind(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(v);
}

function formatTime(ms: number): string {
  if (ms <= 0) return '--:--';
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TournamentTable() {
  const { tournamentId } = useParams();
  const { send, connected } = useSocket();
  const tournamentState = useGameStore(s => (s as any).tournamentState as TournamentState | null);
  const [now, setNow] = useState(Date.now());

  // 5초마다 토너 상태 polling
  useEffect(() => {
    if (!tournamentId || !connected) return;
    const fetch = () => send({ type: 'GET_TOURNAMENT_STATE', tournamentId } as any);
    fetch();
    const t = setInterval(fetch, 5000);
    return () => clearInterval(t);
  }, [tournamentId, connected, send]);

  // 1초 timer (남은 시간 표시용)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!tournamentState || !tournamentState.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1923]">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-[#FFD700] mx-auto mb-3 animate-pulse" />
          <div className="text-white font-bold">토너먼트 정보 로딩...</div>
          <div className="text-[#6B7A90] text-xs mt-1">{tournamentId}</div>
        </div>
      </div>
    );
  }

  const remainMs = (tournamentState.nextLevelAt || 0) - now;
  const blind = tournamentState.currentBlind || { sb: 0, bb: 0 };
  const isFinished = tournamentState.status === 'FINISHED';
  const isCancelled = tournamentState.status === 'CANCELLED';
  const isRegistering = tournamentState.status === 'REGISTERING';

  return (
    <div className="relative min-h-screen bg-[#0F1923]">
      {/* 토너먼트 헤더 — 상단 고정 */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md border-b border-white/10"
        style={{ background: 'linear-gradient(135deg, rgba(15,25,35,0.95), rgba(20,30,45,0.95))' }}
      >
        <div className="px-3 py-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Trophy className="w-4 h-4 text-[#FFD700] shrink-0" />
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-white truncate">{tournamentState.name}</div>
                <div className="text-[9px] text-[#6B7A90]">
                  Status: <span className="text-[#22D3EE] font-bold">{tournamentState.status}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px]">
              <div className="text-center">
                <div className="text-[8px] text-[#6B7A90] uppercase">Lv</div>
                <div className="text-base font-black text-[#FFD700]">{tournamentState.currentLevel || 1}</div>
              </div>
              <div className="text-center">
                <div className="text-[8px] text-[#6B7A90] uppercase">Blinds</div>
                <div className="text-[12px] font-bold text-white font-mono">
                  {formatBlind(blind.sb)} / {formatBlind(blind.bb)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[8px] text-[#6B7A90] uppercase flex items-center gap-1 justify-center">
                  <Clock className="w-2.5 h-2.5" /> Next
                </div>
                <div className="text-[12px] font-bold text-[#34D399] font-mono">{formatTime(remainMs)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px]">
              <div className="text-center">
                <div className="text-[8px] text-[#6B7A90] uppercase flex items-center gap-1 justify-center">
                  <Users className="w-2.5 h-2.5" /> Players
                </div>
                <div className="text-[12px] font-bold text-white font-mono">
                  {tournamentState.playersRemaining || 0}/{tournamentState.totalPlayers || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[8px] text-[#6B7A90] uppercase">Rank</div>
                <div className="text-base font-black text-[#22D3EE]">
                  {tournamentState.myEliminated ? `OUT #${tournamentState.myFinishPosition}` : (tournamentState.myRank || '-')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[8px] text-[#6B7A90] uppercase flex items-center gap-1 justify-center">
                  <TrendingUp className="w-2.5 h-2.5" /> Stack
                </div>
                <div className="text-[12px] font-bold text-white font-mono">{(tournamentState.myStack || 0).toLocaleString()}</div>
                <div className="text-[8px] text-[#6B7A90]">avg {(tournamentState.avgStack || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {isRegistering && (
            <div className="mt-1.5 text-[10px] text-[#FBBF24] text-center">
              ⏰ 등록 중 — {tournamentState.lateRegRemainingSec}초 후 등록 마감
            </div>
          )}
          {(tournamentState.rebuysAvailable || 0) > 0 && tournamentState.myEliminated && (
            <div className="mt-1.5 text-center text-[10px]">
              <button
                onClick={() => send({ type: 'TOURNAMENT_REBUY', tournamentId } as any)}
                className="px-3 py-1 rounded-md bg-[#FFD700]/20 text-[#FFD700] font-bold hover:bg-[#FFD700]/30"
              >
                💰 Rebuy ({tournamentState.rebuysAvailable} 남음)
              </button>
            </div>
          )}
          {isFinished && (
            <div className="mt-1.5 text-center text-[12px] font-bold text-[#FFD700]">
              🏆 토너먼트 종료 — 상금풀 {formatMoney(Math.round((tournamentState.totalPrizePool || 0) / 100))}
            </div>
          )}
          {isCancelled && (
            <div className="mt-1.5 text-center text-[12px] font-bold text-[#EF4444]">
              ⚠️ 토너먼트 취소 — 바이인 환불 처리됨
            </div>
          )}
        </div>
      </div>

      {/* 게임 화면 — GameTable 재사용 */}
      <div className="relative">
        <GameTable />
      </div>

      {/* Phase 2: 토너먼트 종료 결과 모달 */}
      {isFinished && (tournamentState as any).results && (
        <TournamentResultModal
          results={(tournamentState as any).results}
          totalPrizePool={tournamentState.totalPrizePool || 0}
          myFinishPosition={tournamentState.myFinishPosition}
        />
      )}
    </div>
  );
}

function TournamentResultModal({ results, totalPrizePool, myFinishPosition }: { results: any[]; totalPrizePool: number; myFinishPosition?: number | null }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  const top3 = (results || []).slice(0, 3);
  const myResult = (results || []).find((r: any) => r.position === myFinishPosition);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur"
      onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #1A1A2E, #0F0F1E)', border: '2px solid #FFD700' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="text-center py-5"
          style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,107,53,0.05))' }}>
          <div className="text-4xl mb-1">🏆</div>
          <div className="text-base font-black text-[#FFD700]">Tournament Finished</div>
          <div className="text-[11px] text-[#6B7A90] mt-1">상금풀 {formatMoney(Math.round(totalPrizePool / 100))}</div>
        </div>

        {/* Top 3 */}
        <div className="px-5 py-4 space-y-2">
          {top3.map((r: any, i: number) => {
            const medals = ['🥇', '🥈', '🥉'];
            const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors[i]}40` }}>
                <div className="text-2xl">{medals[i]}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{r.nickname || r.playerId}</div>
                  <div className="text-[10px] text-[#6B7A90]">#{r.position}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-mono font-bold" style={{ color: colors[i] }}>
                    {formatMoney(Math.round((r.prize || 0) / 100))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 내 결과 (Top3 가 아니면) */}
        {myResult && myResult.position > 3 && (
          <div className="mx-5 mb-4 p-3 rounded-lg"
            style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid #22D3EE40' }}>
            <div className="text-[10px] text-[#22D3EE] uppercase font-bold mb-1">My Result</div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-white">#{myResult.position} {myResult.nickname || ''}</div>
              <div className="font-mono font-bold text-[#22D3EE]">
                {formatMoney(Math.round((myResult.prize || 0) / 100))}
              </div>
            </div>
          </div>
        )}

        {/* 닫기 */}
        <div className="px-5 pb-5">
          <button onClick={() => setOpen(false)}
            className="w-full py-2.5 rounded-lg text-[12px] font-black text-[#0A0B10]"
            style={{ background: 'linear-gradient(135deg, #FFD700, #E5A500)' }}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
