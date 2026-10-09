import { useState } from "react";
import type { GameState, Page } from "../types";
import { useGame } from "../store";
import { Button, Icon, Modal } from "../components/UI";
import { forgedItems } from "../data/forge";
import { items } from "../data/world";
import { rankNames, professionRank } from "../data/living";
import { forgeBlocked, forgeNeeds, transferReason } from "../engine/forge";
import { equipmentPreview } from "../engine/equipment";
import { derived } from "../engine/game";

export function Forge({
  s,
  navigate,
}: {
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const act = useGame((x) => x.act);
  const [filter, setFilter] = useState("护具");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [confirm, setConfirm] = useState(false);
  const blocked = forgeBlocked(s);
  const own = items.filter((i) => i.slot && s.inventory[i.id] > 0);
  const source = own.find((i) => i.id === from);
  const target = own.find((i) => i.id === to);
  const reason = transferReason(s, from, to);
  const transferStats =
    source && target && !reason
      ? derived({
          ...s,
          upgrades: { ...s.upgrades, [from]: 0, [to]: s.upgrades[from] },
        })
      : null;
  return (
    <div className="forge-page">
      <section className="life-section forge-intro">
        <span className="eyebrow">铁匠铺 · 百炼成器</span>
        <h2>以手艺铸器，以历练试锋</h2>
        <p>
          熟手、七品与试炼5层解锁踏浪护具；名匠、五品与试炼10层解锁四类兵器。图谱常驻，无需随机掉落，每种成品持有一件即可。
        </p>
        <div className="forge-metrics">
          <span>
            铁匠 <b>{rankNames[professionRank(s.living.xp.smithing)]}</b>
          </span>
          <span>
            熟练 <b>{s.living.xp.smithing}</b>
          </span>
          <span>
            试炼 <b>{s.trial.highest}层</b>
          </span>
          <span>
            银两 <b>{s.player.silver}</b>
          </span>
        </div>
        <div className="progression-buttons">
          {s.location !== "smith" && (
            <Button
              disabled={s.life.ended || !!s.combat}
              onClick={() => act({ type: "move", id: "smith" })}
            >
              前往铁匠铺 · 两时辰
            </Button>
          )}
          <Button onClick={() => navigate("living")}>
            采矿冶铁 · 提升熟练
          </Button>
          <Button onClick={() => navigate("trial")}>前往试炼</Button>
          <Button onClick={() => navigate("inventory")}>行囊与强化</Button>
        </div>
        {blocked && (
          <p className="selection-note" role="status">
            {blocked}
          </p>
        )}
        <p className="small muted">
          锻造耗四时辰，熟练+12；成品从+0起步，不自动替换穿戴。下方属性对比已计入当前强化与套装。
        </p>
      </section>
      <div className="profession-tabs forge-tabs" aria-label="锻造图谱分类">
        {["护具", "兵器", "强化传承"].map((x) => (
          <button
            key={x}
            aria-pressed={filter === x}
            onClick={() => setFilter(x)}
          >
            <Icon
              name={x === "兵器" ? "sword" : x === "护具" ? "shirt" : "hammer"}
            />
            <b>{x}</b>
          </button>
        ))}
      </div>
      {filter !== "强化传承" ? (
        <div className="forge-grid">
          {forgedItems
            .filter((i) => (i.slot === "weapon") === (filter === "兵器"))
            .map((item) => {
              const needs = forgeNeeds(s, item.id),
                owned = s.inventory[item.id] > 0,
                worn = s.equipped[item.slot!] === item.id;
              const preview = equipmentPreview(s, item)!;
              return (
                <article className="life-section forge-card" key={item.id}>
                  <header>
                    <div className="forge-emblem">
                      <Icon name={item.icon} />
                    </div>
                    <div>
                      <span className="eyebrow">
                        上品 ·{" "}
                        {item.slot === "weapon" ? "名匠图谱" : "熟手图谱"}
                      </span>
                      <h2>
                        {item.name}
                        {s.upgrades[item.id] ? ` +${s.upgrades[item.id]}` : ""}
                      </h2>
                    </div>
                  </header>
                  <p>{item.description}</p>
                  <div className="tags">
                    {item.attack && <span>外功 +{item.attack}</span>}
                    {item.defense && <span>防御 +{item.defense}</span>}
                    {item.hp && <span>气血上限 +{item.hp}</span>}
                    <span>基础属性 · 未计强化</span>
                  </div>
                  <div className="forge-compare">
                    <p>
                      换下{preview.current?.name || "空装备位"}后 ·{" "}
                      {worn ? "当前已穿戴" : "实际总属性"}
                    </p>
                    <dl>
                      {preview.changes.map((c) => (
                        <div key={c.label}>
                          <dt>{c.label}</dt>
                          <dd>
                            {c.before} → {c.after}
                            <b className={c.after < c.before ? "decrease" : ""}>
                              {c.after === c.before
                                ? "不变"
                                : `${c.after > c.before ? "+" : ""}${c.after - c.before}`}
                            </b>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  {!owned && (
                    <ul
                      className="forge-needs"
                      aria-label={`${item.name}锻造条件`}
                    >
                      {needs.map((n) => (
                        <li key={n.text} className={n.met ? "met" : ""}>
                          <span>{n.met ? "✓" : "○"}</span>
                          {n.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {owned ? (
                    <>
                      <p className="selection-note">
                        已入行囊 · 可在「强化传承」接续旧器强化。
                      </p>
                      <Button
                        disabled={worn || s.life.ended || !!s.combat}
                        onClick={() => act({ type: "equip", id: item.id })}
                      >
                        {worn ? "已装备" : `装备${item.name}`}
                      </Button>
                    </>
                  ) : (
                    <Button
                      kind="ink"
                      disabled={!!blocked || needs.some((n) => !n.met)}
                      onClick={() => act({ type: "forgeCraft", id: item.id })}
                    >
                      锻造{item.name} · 四时辰
                    </Button>
                  )}
                </article>
              );
            })}
        </div>
      ) : (
        <section className="life-section forge-transfer">
          <span className="eyebrow">旧器有功，淬火相传</span>
          <h2>强化传承</h2>
          <p>
            同部位装备可转移强化。来源回到+0，目标变为来源等级；等级不叠加、不复制。两件器甲都保留，当前穿戴不变。每次50两、精铁2块，耗两时辰。
          </p>
          <p className="small muted">
            现有银两{s.player.silver} · 精铁{s.inventory.iron || 0}
            。本卷强化按装备名称记录，同名多件共享等级。
          </p>
          <div className="forge-selects">
            <label>
              来源 · 已强化的旧器
              <select
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setTo("");
                }}
              >
                <option value="">请选择来源</option>
                {own
                  .filter((i) => s.upgrades[i.id] > 0)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} +{s.upgrades[i.id]}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              目标 · 同部位器甲
              <select value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="">请选择目标</option>
                {own
                  .filter(
                    (i) => source && i.slot === source.slot && i.id !== from,
                  )
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} +{s.upgrades[i.id] || 0}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {transferStats && (
            <p className="selection-note">
              当前穿戴传承后：外功{derived(s).attack} → {transferStats.attack}
              ，防御{derived(s).defense} → {transferStats.defense}，气血上限
              {derived(s).maxHp} → {transferStats.maxHp}
              。提升上限不回血；降低时当前气血不超过新上限。
            </p>
          )}
          <p role="status">
            {blocked ||
              reason ||
              `${source?.name} +${s.upgrades[from]} → +0；${target?.name} +${s.upgrades[to] || 0} → +${s.upgrades[from]}`}
          </p>
          <Button
            kind="ink"
            disabled={!!blocked || !!reason}
            onClick={() => setConfirm(true)}
          >
            预览并确认传承
          </Button>
        </section>
      )}
      {confirm && (
        <Modal title="确认强化传承" onClose={() => setConfirm(false)}>
          <p>
            {source?.name}将回到+0，{target?.name}将变为+{s.upgrades[from]}
            。花费50两、精铁2块，耗时两时辰。当前穿戴不会自动更换，目标已有强化将被替代。
          </p>
          <div className="progression-buttons">
            <Button
              kind="ink"
              disabled={!!blocked || !!reason}
              onClick={() => {
                act({ type: "forgeTransfer", from, to });
                setFrom("");
                setTo("");
                setConfirm(false);
              }}
            >
              确认传承 · 50两
            </Button>
            <Button onClick={() => setConfirm(false)}>保留现状</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
