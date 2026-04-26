/**
 * GeoBlocked — Hard-blocked 국가 사용자에게 표시되는 안내 페이지.
 *
 * Beta-G Day 2-3 (2026-04-26): 라이선스 미보유 지역 차단.
 * URL ?geoOverride=allow 으로 우회 가능 (개발/QA).
 */

import { Shield } from "lucide-react";

interface Props {
  country: string;
  reason: string;
}

export default function GeoBlocked({ country, reason }: Props) {
  return (
    <div className="min-h-screen bg-[#0B0E14] dark flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <Shield className="w-16 h-16 mx-auto mb-6 text-[#FF6B35]" />
        <h1 className="text-2xl font-black text-white mb-3">Service Unavailable</h1>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-6">
          {reason}
        </p>
        <div className="rounded-xl p-4 mb-6"
          style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)" }}>
          <p className="text-xs text-[#FF6B35] font-semibold mb-2">Detected region: {country}</p>
          <p className="text-[11px] text-[#8899AB] leading-relaxed">
            TETHER.BET HOLDEM operates under specific licensing requirements.
            Service is not available in your jurisdiction at this time.
          </p>
        </div>
        <div className="text-[10px] text-[#4A5A70] leading-relaxed">
          If you believe this is an error, please verify your VPN/proxy settings or contact support.
          <br/><br/>
          By entering this site you confirm you are 18+ and located in a permitted jurisdiction.
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <a href="/terms" className="text-[10px] text-[#6B7A90] underline">Terms of Service</a>
          <a href="/privacy" className="text-[10px] text-[#6B7A90] underline">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
