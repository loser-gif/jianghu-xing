import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { prepareArtwork, watchArtwork } from "../artAssets";
import type { ArtProgress } from "../artAssets";

export function ArtworkGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ArtProgress>({
    completed: 0,
    total: 1,
    failed: 0,
    done: false,
  });
  const [skip, setSkip] = useState(false);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const unsubscribe = watchArtwork(setState);
    void prepareArtwork();
    const timer = setTimeout(() => setSlow(true), 6000);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);
  if (skip || (state.done && state.failed === 0)) return children;
  const percent = Math.round((state.completed / state.total) * 100);
  return (
    <main className="artwork-gate">
      <span className="seal">杭州篇</span>
      <h1>江湖行</h1>
      <p role="status">{state.done ? "有几幅画卷暂未载入" : "正在铺展画卷"}</p>
      <progress
        value={state.completed}
        max={state.total}
        aria-label="画卷准备进度"
      />
      <span className="artwork-percent">{percent}%</span>
      <p className="secondary">
        {state.done
          ? "可以重试，也可以先进入游戏。"
          : "初次需准备片刻，之后优先读取已存画卷。"}
      </p>
      {(state.done || slow) && (
        <div className="artwork-recovery">
          {state.done && (
            <button
              className="ink-button"
              onClick={() => {
                void prepareArtwork();
              }}
            >
              重新载入
            </button>
          )}
          <button className="outline-button" onClick={() => setSkip(true)}>
            先进入游戏
          </button>
        </div>
      )}
    </main>
  );
}
