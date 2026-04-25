/**
 * 클라이언트 경량 핸드 평가기 — GG포커 스타일 족보 표시용
 *
 * 히어로 카드 2장 + 커뮤니티 카드 0~5장 → 현재 최고 족보 반환
 * 서버 HandEvaluator와 독립 (클라이언트 표시 전용, 정확도 충분)
 */

export interface Card {
  suit: string;  // 'spades' | 'hearts' | 'diamonds' | 'clubs'
  rank: string;  // '2'~'10', 'J', 'Q', 'K', 'A'
}

export interface HandResult {
  rank: number;       // 0=하이카드 ~ 9=로얄플러시
  name: string;       // 영어 이름
  nameKey: string;    // i18n 키
  description: string; // 상세 (예: "Pair of Aces")
  strength: 'weak' | 'medium' | 'strong' | 'premium'; // 색상용
  draws?: string[];   // 드로우 가능성
}

const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

const RANK_NAMES: Record<string, string> = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8',
  '9': '9', '10': '10', 'J': 'Jack', 'Q': 'Queen', 'K': 'King', 'A': 'Ace',
};

function rankVal(r: string): number { return RANK_VALUES[r] ?? 0; }

function getAllCombinations(cards: Card[], size: number): Card[][] {
  if (size === 0) return [[]];
  if (cards.length < size) return [];
  const result: Card[][] = [];
  for (let i = 0; i <= cards.length - size; i++) {
    const rest = getAllCombinations(cards.slice(i + 1), size - 1);
    for (const combo of rest) result.push([cards[i], ...combo]);
  }
  return result;
}

function evaluateFive(cards: Card[]): { rank: number; tiebreaker: number[]; detail: string } {
  const values = cards.map(c => rankVal(c.rank)).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const unique = [...new Set(values)].sort((a, b) => b - a);

  // Straight check (including A-2-3-4-5 wheel)
  let isStraight = false;
  let straightHigh = 0;
  if (unique.length === 5) {
    if (values[0] - values[4] === 4) {
      isStraight = true;
      straightHigh = values[0];
    } else if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
      isStraight = true;
      straightHigh = 5; // wheel
    }
  }

  // Count groups
  const counts: Record<number, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([v, c]) => ({ val: Number(v), count: c }))
    .sort((a, b) => b.count - a.count || b.val - a.val);

  // Royal Flush
  if (isFlush && isStraight && straightHigh === 14) {
    return { rank: 9, tiebreaker: [14], detail: 'Royal Flush' };
  }
  // Straight Flush
  if (isFlush && isStraight) {
    return { rank: 8, tiebreaker: [straightHigh], detail: `Straight Flush (${straightHigh} high)` };
  }
  // Four of a Kind
  if (groups[0].count === 4) {
    return { rank: 7, tiebreaker: [groups[0].val, groups[1].val], detail: `Four ${RANK_NAMES[String(groups[0].val)] || groups[0].val}s` };
  }
  // Full House
  if (groups[0].count === 3 && groups[1]?.count === 2) {
    return { rank: 6, tiebreaker: [groups[0].val, groups[1].val], detail: `Full House (${RANK_NAMES[String(groups[0].val)] || groups[0].val}s full of ${RANK_NAMES[String(groups[1].val)] || groups[1].val}s)` };
  }
  // Flush
  if (isFlush) {
    return { rank: 5, tiebreaker: values, detail: `Flush (${RANK_NAMES[String(values[0])] || values[0]} high)` };
  }
  // Straight
  if (isStraight) {
    return { rank: 4, tiebreaker: [straightHigh], detail: `Straight (${RANK_NAMES[String(straightHigh)] || straightHigh} high)` };
  }
  // Three of a Kind
  if (groups[0].count === 3) {
    return { rank: 3, tiebreaker: [groups[0].val, ...values.filter(v => v !== groups[0].val)], detail: `Three ${RANK_NAMES[String(groups[0].val)] || groups[0].val}s` };
  }
  // Two Pair
  if (groups[0].count === 2 && groups[1]?.count === 2) {
    const high = Math.max(groups[0].val, groups[1].val);
    const low = Math.min(groups[0].val, groups[1].val);
    return { rank: 2, tiebreaker: [high, low, groups[2]?.val ?? 0], detail: `Two Pair (${RANK_NAMES[String(high)] || high}s & ${RANK_NAMES[String(low)] || low}s)` };
  }
  // One Pair
  if (groups[0].count === 2) {
    return { rank: 1, tiebreaker: [groups[0].val, ...values.filter(v => v !== groups[0].val)], detail: `Pair of ${RANK_NAMES[String(groups[0].val)] || groups[0].val}s` };
  }
  // High Card
  return { rank: 0, tiebreaker: values, detail: `${RANK_NAMES[String(values[0])] || values[0]} High` };
}

function detectDraws(holeCards: Card[], community: Card[]): string[] {
  if (community.length < 3) return [];
  const all = [...holeCards, ...community];
  const draws: string[] = [];

  // Flush draw
  const suitCounts: Record<string, number> = {};
  for (const c of all) suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  for (const [, count] of Object.entries(suitCounts)) {
    if (count === 4) { draws.push('Flush Draw'); break; }
  }

  // Straight draw (open-ended or gutshot)
  const uniqueVals = [...new Set(all.map(c => rankVal(c.rank)))].sort((a, b) => a - b);
  // Add low ace
  if (uniqueVals.includes(14)) uniqueVals.unshift(1);
  for (let i = 0; i <= uniqueVals.length - 4; i++) {
    const window = uniqueVals.slice(i, i + 5);
    if (window.length >= 4) {
      const span = window[window.length - 1] - window[0];
      if (span === 4 && window.length === 4) { draws.push('Open-Ended Straight Draw'); break; }
      if (span === 4 && window.length === 5) break; // already a straight
      if (span === 3 && window.length === 4) { draws.push('Gutshot'); break; }
    }
  }

  return draws;
}

const HAND_NAMES: { name: string; key: string; strength: HandResult['strength'] }[] = [
  { name: 'High Card',      key: 'hand.highCard',      strength: 'weak' },
  { name: 'One Pair',       key: 'hand.onePair',       strength: 'weak' },
  { name: 'Two Pair',       key: 'hand.twoPair',       strength: 'medium' },
  { name: 'Three of a Kind',key: 'hand.threeOfAKind',  strength: 'medium' },
  { name: 'Straight',       key: 'hand.straight',      strength: 'strong' },
  { name: 'Flush',          key: 'hand.flush',         strength: 'strong' },
  { name: 'Full House',     key: 'hand.fullHouse',     strength: 'strong' },
  { name: 'Four of a Kind', key: 'hand.fourOfAKind',   strength: 'premium' },
  { name: 'Straight Flush', key: 'hand.straightFlush', strength: 'premium' },
  { name: 'Royal Flush',    key: 'hand.royalFlush',    strength: 'premium' },
];

/**
 * 히어로 카드 + 커뮤니티 카드로 현재 최고 족보 평가
 *
 * NLHE: hole 2장, 7장 중 5장 자유
 * PLO: hole 4장, hole 정확히 2장 + 보드 정확히 3장 강제 (V22 Phase 2+ V2.7)
 */
export function evaluateHeroHand(holeCards: Card[], communityCards: Card[]): HandResult | null {
  if (holeCards.length < 2) return null;

  const isPLO = holeCards.length >= 4;

  // 프리플롭 (커뮤니티 0장) — 포켓 페어만 표시 (NLHE 만)
  if (communityCards.length === 0) {
    if (isPLO) return null; // PLO 는 4장이라 의미 적음
    if (rankVal(holeCards[0].rank) === rankVal(holeCards[1].rank)) {
      const name = HAND_NAMES[1];
      return {
        rank: 1,
        name: name.name,
        nameKey: name.key,
        description: `Pocket ${RANK_NAMES[holeCards[0].rank] || holeCards[0].rank}s`,
        strength: rankVal(holeCards[0].rank) >= 10 ? 'strong' : 'medium',
      };
    }
    return null;
  }

  let best = { rank: -1, tiebreaker: [] as number[], detail: '' };

  if (isPLO) {
    // PLO: hole 정확히 2장 + 보드 정확히 3장 강제 (보드 ≥3 필요)
    if (communityCards.length < 3) return null;
    const holeCombos = getAllCombinations(holeCards.slice(0, 4), 2);
    const boardCombos = getAllCombinations(communityCards, 3);
    for (const h of holeCombos) {
      for (const b of boardCombos) {
        const result = evaluateFive([...h, ...b]);
        if (result.rank > best.rank ||
            (result.rank === best.rank && result.tiebreaker.join(',') > best.tiebreaker.join(','))) {
          best = result;
        }
      }
    }
  } else {
    // NLHE: 5장 이상이면 최고 5장 조합 찾기
    const allCards = [...holeCards, ...communityCards];
    if (allCards.length >= 5) {
      const combos = getAllCombinations(allCards, 5);
      for (const combo of combos) {
        const result = evaluateFive(combo);
        if (result.rank > best.rank ||
            (result.rank === best.rank && result.tiebreaker.join(',') > best.tiebreaker.join(','))) {
          best = result;
        }
      }
    } else {
      best = evaluateFive([...allCards, ...Array(5 - allCards.length).fill({ suit: 'x', rank: '2' })]);
    }
  }

  if (best.rank < 0) return null;

  const handInfo = HAND_NAMES[best.rank] ?? HAND_NAMES[0];
  const draws = isPLO ? undefined : detectDraws(holeCards, communityCards);

  return {
    rank: best.rank,
    name: handInfo.name,
    nameKey: handInfo.key,
    description: best.detail,
    strength: handInfo.strength,
    draws: draws && draws.length > 0 ? draws : undefined,
  };
}
