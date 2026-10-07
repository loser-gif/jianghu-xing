import { timeLabel } from "../data/world";
import type { GameState } from "../types";

export function Journal({ s }: { s: GameState }) {
  return (
    <div className="journal-page">
      {s.journal.map((j, i) => (
        <article key={i}>
          <div>
            <span>大胤十二年</span>
            <time>{timeLabel(j.time)}</time>
          </div>
          <p>{j.text}</p>
        </article>
      ))}
    </div>
  );
}
