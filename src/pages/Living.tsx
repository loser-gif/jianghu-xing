import { useState } from "react";
import type { GameState, Page } from "../types";
import { useGame } from "../store";
import {
  professions,
  recipes,
  orders,
  professionRank,
  rankNames,
  type Profession,
} from "../data/living";
import { items, locations } from "../data/world";
import { Button, Icon } from "../components/UI";
export function Living({
  s,
  navigate,
}: {
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const act = useGame((x) => x.act),
    [job, setJob] = useState<Profession>(
      s.location === "smith"
        ? "smithing"
        : s.location === "lake"
          ? "fishing"
          : "herbalism",
    );
  const p = professions.find((x) => x.id === job)!,
    rank = professionRank(s.living.xp[job]),
    here = s.location === p.location;
  const itemName = (id: string) => items.find((x) => x.id === id)?.name || id;
  const available = recipes.filter((r) => r.job === job);
  const o = orders.find((o) => o.job === job)!;
  const done = s.living.orders[o.id] === Math.floor(s.time / 6);
  const prices: Record<string, number> = {
    herb: 2,
    ore: 2,
    fish: 2,
    medicine: 6,
    iron: 4,
    soup: 6,
    tonic: 8,
  };
  return (
    <div className="living-page">
      <section className="life-section living-intro">
        <span className="eyebrow">百业皆可立身</span>
        <h2>采一份材料，养一身本领</h2>
        <p>
          三种身份可以兼修，采集 +3熟练、制作 +6、交单 +8。20 / 60 /
          120熟练晋升学徒、熟手、名匠；熟手制作药物、精铁和食物额外产出一份。
        </p>
        <div className="living-checklist">
          <span className={s.living.gathered ? "done" : ""}>
            {s.living.gathered ? "✓" : "01"} 采集材料
          </span>
          <span className={s.living.crafted ? "done" : ""}>
            {s.living.crafted ? "✓" : "02"} 制作成品
          </span>
          <span className={s.living.delivered ? "done" : ""}>
            {s.living.delivered ? "✓" : "03"} 交付订单
          </span>
        </div>
        <p className="small muted">
          先采集，再按配方制作两次，凑齐成品交单；若工本银两不足，可把材料带到客栈市集出售。
        </p>
      </section>
      <div className="profession-tabs" aria-label="生活身份">
        {professions.map((x) => (
          <button
            key={x.id}
            aria-pressed={job === x.id}
            onClick={() => setJob(x.id)}
          >
            <Icon name={x.icon} />
            <b>{x.name}</b>
            <small>
              {rankNames[professionRank(s.living.xp[x.id])]} ·{" "}
              {s.living.xp[x.id]}熟练
            </small>
          </button>
        ))}
      </div>
      <div className="living-workshop">
        <section className="life-section">
          <span className="eyebrow">
            {locations.find((l) => l.id === p.location)?.name}
          </span>
          <h2>
            {p.name} · {rankNames[rank]}
          </h2>
          <p>
            当前熟练 {s.living.xp[job]}
            {rank < 3 ? ` / ${[20, 60, 120][rank]}` : " · 已达本卷最高称谓"}
          </p>
          <p>
            {p.action}每次获得{p.materialName} ×{2 + rank}
            ，耗时两时辰。采集无需银两。
          </p>
          {!here && (
            <Button onClick={() => act({ type: "move", id: p.location })}>
              前往{locations.find((l) => l.id === p.location)?.name} · 两时辰
            </Button>
          )}
          <Button
            kind="ink"
            disabled={!here || s.life.ended}
            onClick={() => act({ type: "gather", id: job })}
          >
            {p.action} · 两时辰
          </Button>
          <p>
            现有{p.materialName}：{s.inventory[p.material] || 0}
          </p>
        </section>
        <section className="life-section">
          <h2>{p.verb}配方</h2>
          {available.map((r) => {
            const missing = Object.entries(r.need)
              .filter(([k, n]) => (s.inventory[k] || 0) < n)
              .map(([k, n]) => `${itemName(k)}缺${n - (s.inventory[k] || 0)}`);
            const reason = !here
              ? "需在对应地点"
              : rank < r.rank
                ? `需要${rankNames[r.rank]}身份`
                : missing.length
                  ? missing.join("、")
                  : s.player.silver < r.cost
                    ? `银两缺${r.cost - s.player.silver}`
                    : "";
            return (
              <article className="recipe-row" key={r.id}>
                <h3>
                  {r.name} ×{r.count + (rank >= 2 && r.id !== "boots" ? 1 : 0)}
                </h3>
                <p>{r.text}</p>
                <p className="small">
                  {Object.entries(r.need)
                    .map(
                      ([k, n]) => `${itemName(k)} ${s.inventory[k] || 0}/${n}`,
                    )
                    .join(" · ")}{" "}
                  · 工本{r.cost}两（现有{s.player.silver}）
                </p>
                <Button
                  disabled={!!reason || s.life.ended}
                  onClick={() => act({ type: "craft", id: r.id })}
                >
                  制作 · 两时辰
                </Button>
                <p className="small muted">
                  {reason || "材料齐备，成品进入行囊。"}
                </p>
              </article>
            );
          })}
        </section>
      </div>
      <section className="life-section">
        <span className="eyebrow">每日委托 · 随游戏日更新</span>
        <h2>{o.title}</h2>
        <p>
          交付{itemName(o.item)} ×{o.count}（现有{s.inventory[o.item] || 0}
          ），获得{o.silver}两与8点技艺熟练。
        </p>
        <Button
          disabled={
            !here ||
            done ||
            (s.inventory[o.item] || 0) < o.count ||
            s.life.ended
          }
          onClick={() => act({ type: "order", id: o.id })}
        >
          {done ? "本日已交付" : "交付订单"}
        </Button>
        <p className="small muted">
          {!here
            ? "前往本职业地点交付。"
            : done
              ? "次日可再次承接，无需现实签到。"
              : "交付不耗时，不会扣除多余物品。"}
        </p>
      </section>
      <section className="life-section">
        <h2>客栈市集 · 出售余料</h2>
        <p>余料和成品可换银两，装备与任务道具不在这份出售清单中。</p>
        {s.location !== "inn" && (
          <Button onClick={() => act({ type: "move", id: "inn" })}>
            前往客栈 · 两时辰
          </Button>
        )}
        <div className="market-grid">
          {Object.entries(prices).map(([id, price]) => (
            <div key={id}>
              <span>
                {itemName(id)} ×{s.inventory[id] || 0}
              </span>
              <Button
                disabled={
                  s.location !== "inn" || !(s.inventory[id] > 0) || s.life.ended
                }
                onClick={() => act({ type: "sell", id })}
              >
                出售1份 · {price}两
              </Button>
            </div>
          ))}
        </div>
      </section>
      <div className="progression-buttons">
        <Button onClick={() => navigate("forge")}>
          百炼坊 · 进阶器甲与强化传承
        </Button>
        <Button onClick={() => navigate("inventory")}>
          行囊 · 使用补给 / 装备成品
        </Button>
        <Button onClick={() => navigate("calendar")}>查看年历与余寿</Button>
      </div>
    </div>
  );
}
