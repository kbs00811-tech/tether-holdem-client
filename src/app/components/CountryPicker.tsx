/**
 * CountryPicker — 국가 선택 그리드
 * SettingsModal + ProfilePanel 둘 다에서 재사용
 */

import { type ReactNode } from "react";
import { COUNTRIES } from "../stores/settingsStore";

export interface CountryPickerProps {
  value: string | null;
  onChange: (code: string | null) => void;
  /** compact: 더 작은 버튼 (작은 컨테이너용) */
  compact?: boolean;
  /** 헤더 표시 여부 */
  showLabel?: boolean;
  /** 라벨 — string 또는 JSX */
  label?: ReactNode;
  /** 컬럼 수 (기본 6) */
  columns?: number;
  /** 최대 높이 (스크롤) */
  maxHeight?: number;
}

/**
 * V22 Phase 2+: Windows Chrome 이 regional indicator emoji (🇰🇷 등) 를 국기로 렌더하지 못함.
 * (Segoe UI Emoji 에 flag font 없음 — macOS/iOS/Android 는 정상)
 * 해결: flagcdn.com CDN 의 PNG 이미지 사용. ISO alpha-2 코드로 매핑.
 * Fallback: img 로딩 실패 시 emoji 노출 (alt + 인접 span).
 */
function FlagImage({ code, emoji, compact }: { code: string; emoji: string; compact: boolean }) {
  const w = compact ? 24 : 32;
  const h = compact ? 16 : 22;
  return (
    <span className="inline-flex items-center justify-center" style={{ width: w, height: h }}>
      <img
        src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
        srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
        alt={emoji}
        width={w}
        height={h}
        loading="lazy"
        className="rounded-[3px] object-cover shadow-sm"
        style={{ width: w, height: h }}
        onError={(e) => {
          // 이미지 실패 시 이모지로 fallback
          const t = e.currentTarget;
          t.style.display = 'none';
          const fallback = t.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = 'inline';
        }}
      />
      <span className="text-base leading-none" style={{ display: 'none' }}>{emoji}</span>
    </span>
  );
}

export function CountryPicker({
  value,
  onChange,
  compact = false,
  showLabel = true,
  label,
  columns = 6,
  maxHeight = 200,
}: CountryPickerProps) {
  const padY = compact ? 'py-1.5' : 'py-2';
  const codeSize = 'text-[9px]';

  return (
    <div>
      {showLabel && (
        <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">
          {label || (
            <>Country <span className="text-[#4A5A70] normal-case tracking-normal">· 국가 (선택)</span></>
          )}
        </h3>
      )}
      <div
        className={`grid gap-2 overflow-y-auto p-1`}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          maxHeight: `${maxHeight}px`,
        }}
      >
        {/* None (미선택) */}
        <button
          onClick={() => onChange(null)}
          className={`flex flex-col items-center gap-1 ${padY} rounded-lg transition-all`}
          title="None"
          aria-label="국가 미선택"
          style={{
            background: value === null ? "rgba(255,107,53,0.15)" : "rgba(255,255,255,0.02)",
            border: value === null ? "2px solid #FF6B35" : "2px solid transparent",
          }}>
          <span className={`${compact ? 'text-base' : 'text-xl'} leading-none`}>🌍</span>
          <span className={`${codeSize} font-bold text-[#6B7A90]`}>None</span>
        </button>

        {COUNTRIES.map(c => {
          const labelText = c.nameLocal ? `${c.name} (${c.nameLocal})` : c.name;
          const selected = value === c.code;
          return (
            <button
              key={c.code}
              onClick={() => onChange(c.code)}
              className={`flex flex-col items-center gap-1 ${padY} rounded-lg transition-all no-touch-min`}
              title={labelText}
              aria-label={labelText}
              style={{
                background: selected ? "rgba(255,107,53,0.15)" : "rgba(255,255,255,0.02)",
                border: selected ? "2px solid #FF6B35" : "2px solid transparent",
              }}>
              <FlagImage code={c.code} emoji={c.flag} compact={compact} />
              <span className={`${codeSize} font-bold`} style={{ color: selected ? "#FF6B35" : "#6B7A90" }}>{c.code}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
