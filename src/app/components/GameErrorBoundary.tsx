import { Component, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 게임 크래시 방지 — React 에러 시 빈 화면 대신 복구 UI 표시
 *
 * 이전 문제: setOnlineCount ReferenceError → 앱 전체 크래시 → 흰 화면
 * 해결: ErrorBoundary가 에러 잡아서 "다시 시도" 버튼 표시
 */
export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[ERROR BOUNDARY]', error.message, info?.componentStack?.slice(0, 500));
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, #0C1620, #050A10)' }}>
          <div className="text-center p-8 max-w-sm">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span style={{ fontSize: 32 }}>⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">게임 오류</h2>
            <p className="text-xs text-gray-500 mb-1">
              {this.state.error?.message?.slice(0, 100) || '알 수 없는 오류'}
            </p>
            <p className="text-[10px] text-gray-600 mb-6">
              게임이 일시적으로 중단되었습니다
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={this.handleRetry}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #E85D2C)' }}>
                <RefreshCw className="w-4 h-4" />
                다시 시도
              </button>
              <button onClick={this.handleReload}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-400"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
