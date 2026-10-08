import { realms } from "../engine/cultivation";
import { useGame } from "../store";
import { arts } from "../data/world";
import { Icon, Portrait, Button, Meter, Modal } from "../components/UI";
import type { GameState } from "../types";
import { derived } from "../engine/game";
import { useEffect, useRef, useState } from "react";

function CombatPortrait({
  gender,
  index = 6,
  delta = 0,
  round,
}: {
  gender?: "male" | "female";
  index?: number;
  delta?: number;
  round: number;
}) {
  return (
    <div className="combat-portrait">
      <Portrait index={index} gender={gender} />
      {delta !== 0 && (
        <div
          key={round}
          className={`combat-impact ${delta > 0 ? "restoring" : "struck"}`}
          aria-hidden="true"
        >
          <i className="impact-mark" />
          <span className="impact-number">
            {delta > 0 ? "+" : "−"}
            {Math.abs(delta)}
          </span>
        </div>
      )}
    </div>
  );
}

export function Combat({ s }: { s: GameState }) {
  const act = useGame((x) => x.act);
  const c = s.combat!,
    d = derived(s),
    art = arts.find((a) => a.id === s.activeArt)!;
  const previous = useRef({ round: c.round, player: s.player.hp, enemy: c.hp });
  const [pulse, setPulse] = useState<{
    round: number;
    player: number;
    enemy: number;
  } | null>(null);
  useEffect(() => {
    const before = previous.current;
    previous.current = { round: c.round, player: s.player.hp, enemy: c.hp };
    if (before.round === c.round) return;
    setPulse({
      round: c.round,
      player: s.player.hp - before.player,
      enemy: c.hp - before.enemy,
    });
    const timer = window.setTimeout(() => setPulse(null), 1200);
    return () => window.clearTimeout(timer);
  }, [c.round, c.hp, s.player.hp]);
  return (
    <Modal title="旧码头 · 交锋" wide>
      <div className="combat-round">
        第 {c.round} 回合 <span>活捉 · 非致命交锋</span>
      </div>
      <div className="combatants">
        <div>
          <CombatPortrait
            gender={s.player.gender}
            delta={pulse?.player}
            round={pulse?.round ?? c.round}
          />
          <h3>
            {s.player.name} · {realms[s.cultivation.realm]}
          </h3>
          <Meter label="气血" value={s.player.hp} max={d.maxHp} color="red" />
          <Meter label="内力" value={s.player.qi} max={d.maxQi} />
        </div>
        <span className="versus">
          交<br />锋
        </span>
        <div>
          <CombatPortrait
            index={5}
            delta={pulse?.enemy}
            round={pulse?.round ?? c.round}
          />
          <h3>顾红绫 · 八品</h3>
          <Meter label="气血" value={c.hp} max={c.maxHp} color="red" />
          <p className="small muted">身轻如燕 · 每三回合使出燕返</p>
        </div>
      </div>
      <p className="combat-intent">
        {c.round % 3 === 0
          ? "敌方意图：燕返重击（基础 44）· 宜防守或轻功闪避"
          : "敌方意图：试探进攻（基础 32）· 防御会抵消部分伤害"}
      </p>
      <div className="combat-log" aria-live="polite">
        {c.logs.slice(0, 5).map((l, i) => (
          <p key={`${c.round}-${i}`} className={i === 0 ? "latest" : ""}>
            {l}
          </p>
        ))}
      </div>
      <div className="combat-actions">
        <Button kind="ink" onClick={() => act({ type: "fight", id: "attack" })}>
          <Icon name="sword" size={17} />
          普通攻击
        </Button>
        <Button
          disabled={s.player.qi < art.cost}
          onClick={() => act({ type: "fight", id: "art" })}
        >
          <Icon name="book" size={17} />
          {art.name}
          <small>{art.cost} 内力</small>
        </Button>
        <Button onClick={() => act({ type: "fight", id: "defend" })}>
          <Icon name="shield" size={17} />
          防御调息
        </Button>
        <Button
          disabled={!s.arts.lightArt || s.player.qi < 8}
          onClick={() => act({ type: "fight", id: "light" })}
        >
          <Icon name="wind" size={17} />
          追云步<small>8 内力</small>
        </Button>
        <Button
          disabled={!(s.inventory.medicine > 0) || s.player.hp >= d.maxHp}
          onClick={() => act({ type: "fight", id: "medicine" })}
        >
          <Icon name="flask" size={17} />
          金疮药 ×{s.inventory.medicine || 0}
        </Button>
        <Button
          kind="danger"
          onClick={() => act({ type: "fight", id: "escape" })}
        >
          撤离 · 本次缉捕失败
        </Button>
      </div>
      <p className="small muted">
        普通攻击无需内力；防御减伤并恢复 14
        内力；道具占用一回合。每次行动均自动存档。
      </p>
      <div className="inline-feedback" role="status">
        {s.lastMessage}
      </div>
    </Modal>
  );
}
