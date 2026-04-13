/**
 * TETHER.BET Holdem - Profile API Client
 *
 * B2C 서버 (tether-bet.vercel.app) 의 /api/user/* 엔드포인트와 통신.
 * JWT 토큰은 URL 파라미터(?token=...) 에서 가져옴 (WebSocket과 동일).
 */

// B2C API base — iframe 호스트 origin 사용, 없으면 기본값
function getApiBase(): string {
  // Embed 모드: 호스트가 B2C 도메인
  if (typeof window !== 'undefined') {
    try {
      // iframe 내부면 부모 origin 사용
      if (window.self !== window.top && document.referrer) {
        const parent = new URL(document.referrer);
        return parent.origin;
      }
    } catch {}
  }
  // 기본값 — B2C 프로덕션
  return 'https://tether-bet.vercel.app';
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBase();
  const token = getToken();
  if (!token) throw new Error('No JWT token in URL — cannot authenticate');

  const res = await fetch(base + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `API error ${res.status}`);
  }
  return data;
}

// ═══════════════════════════════════════════════════
// Profile (아바타, display_name, preferences)
// ═══════════════════════════════════════════════════
export interface PlayerProfile {
  member_id: string;
  avatar_id: number;
  display_name?: string;
  bio?: string;
  country?: string;
  preferences?: any;
  total_hands: number;
  hands_won: number;
  total_bet: number;
  total_win: number;
  biggest_win: number;
  biggest_loss: number;
  longest_win_streak: number;
  current_streak: number;
  vpip_count: number;
  pfr_count: number;
  aggressive_actions: number;
  passive_actions: number;
  last_played_at?: string;
}

export async function getProfile(): Promise<PlayerProfile> {
  const r = await apiFetch<{ profile: PlayerProfile }>('/api/user/profile');
  return r.profile;
}

export async function updateProfile(updates: Partial<PlayerProfile>): Promise<void> {
  await apiFetch('/api/user/profile', {
    method: 'POST',
    body: JSON.stringify(updates),
  });
}

// ═══════════════════════════════════════════════════
// Stats (기간 필터)
// ═══════════════════════════════════════════════════
export interface StatsResponse {
  period: string;
  stats: {
    totalHands: number;
    handsWon: number;
    winRate: number;
    totalBet: number;
    totalWin: number;
    netProfit: number;
    biggestWin: number;
    biggestLoss: number;
    currentStreak: number;
    longestWinStreak: number;
    vpip: number;
    pfr: number;
    af: number;
  };
  profitTrend: Array<{ date: string; cumProfit: number }>;
}

export async function getStats(period: 'today' | 'week' | 'month' | 'all' = 'week'): Promise<StatsResponse> {
  return apiFetch<StatsResponse>(`/api/user/stats?period=${period}`);
}

// ═══════════════════════════════════════════════════
// Hand History (필터/검색)
// ═══════════════════════════════════════════════════
export interface HandRecord {
  id: number;
  session_id: string;
  hand_number: number;
  bet_amount: number;
  win_amount: number;
  rake_amount: number;
  result: 'win' | 'lose' | 'fold' | 'split';
  vpip: boolean;
  pfr: boolean;
  phase_reached?: string;
  played_at: string;
  table_name?: string;
  stakes?: string;
}

export interface HandHistoryParams {
  limit?: number;
  offset?: number;
  result?: 'win' | 'lose' | 'fold' | 'split';
  sessionId?: string;
  from?: string;
  to?: string;
}

export async function getHandHistory(params: HandHistoryParams = {}): Promise<{
  hands: HandRecord[];
  total: number;
  limit: number;
  offset: number;
}> {
  const q = new URLSearchParams();
  if (params.limit) q.set('limit', String(params.limit));
  if (params.offset) q.set('offset', String(params.offset));
  if (params.result) q.set('result', params.result);
  if (params.sessionId) q.set('session_id', params.sessionId);
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);

  return apiFetch(`/api/user/hand-history?${q.toString()}`);
}

// ═══════════════════════════════════════════════════
// 서버 사용 가능 여부 체크
// ═══════════════════════════════════════════════════
export function canUseServerStats(): boolean {
  return !!getToken();
}
