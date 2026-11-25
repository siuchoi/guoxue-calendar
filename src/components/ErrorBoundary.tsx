import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * 页面级错误边界：某个排盘页渲染/计算抛错时只废掉这一页，
 * 顶栏、tab 导航和页脚保持可用；切换到其他 tab 会自动重置。
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('页面渲染失败:', error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="card error-card">
          <div className="section-title" style={{ marginTop: 0 }}>这一页出错了</div>
          <p className="error-msg">计算时发生异常：{error.message || String(error)}</p>
          <div className="error-actions">
            <button onClick={() => this.setState({ error: null })}>重试</button>
            <button onClick={() => window.location.reload()}>刷新页面</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}