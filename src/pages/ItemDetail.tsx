import { useGame } from "../store";
import { items } from "../data/world";
import { Icon, Button, Section, Modal } from "../components/UI";
import type { GameState, Item } from "../types";
import { derived } from "../engine/game";

export function ItemDetail({
  item: i,
  s,
  onClose,
}: {
  item: Item;
  s: GameState;
  onClose: () => void;
}) {
  const act = useGame((x) => x.act);
  const level = s.upgrades[i.id] || 0;
  const cost = 20 + level * 15;
  const equipped = Object.values(s.equipped).includes(i.id);
  const current = items.find((x) => x.id === s.equipped[i.slot || ""]);
  return (
    <Modal title="物中江湖" onClose={onClose}>
      <div className="item-detail-hero">
        <div className="item-illustration">
          <Icon name={i.icon} size={86} />
        </div>
        <div>
          <span className="eyebrow">
            {i.kind} · {i.quality || "随身之物"}
          </span>
          <h1>
            {i.name}
            {level ? ` +${level}` : ""}
          </h1>
          <p>持有 {s.inventory[i.id] || 0} 件</p>
        </div>
      </div>
      <p className="prose">{i.description}</p>
      {i.kind === "装备" && (
        <>
          <div className="stat-strip">
            {i.attack && (
              <div>
                外功<strong>+{i.attack + level * 3}</strong>
              </div>
            )}
            {i.defense && (
              <div>
                防御<strong>+{i.defense}</strong>
              </div>
            )}
            {i.hp && (
              <div>
                气血<strong>+{i.hp}</strong>
              </div>
            )}
          </div>
          {current && current.id !== i.id && (
            <p className="selection-note">
              当前装备：{current.name}。更换后外功变化{" "}
              {(i.attack || 0) +
                level * 3 -
                (current.attack || 0) -
                (s.upgrades[current.id] || 0) * 3}
              ，防御变化 {(i.defense || 0) - (current.defense || 0)}。
            </p>
          )}
          <Button
            kind="ink"
            className="full"
            disabled={equipped}
            onClick={() => act({ type: "equip", id: i.id })}
          >
            {equipped ? "已装备" : "装备此物"}
          </Button>
          {i.attack && (
            <Section title="百炼成锋">
              <p className="muted">
                强化 +{level} → +{Math.min(5, level + 1)} · 外功 +3
              </p>
              <div className="forge-requirements">
                <span>
                  成功率 <b>100%</b>
                </span>
                <span>
                  精铁 <b>{s.inventory.iron || 0} / 2</b>
                </span>
                <span>
                  银两 <b>{cost} 两</b>
                </span>
              </div>
              <Button
                className="full"
                disabled={
                  s.location !== "smith" ||
                  level >= 5 ||
                  (s.inventory.iron || 0) < 2 ||
                  s.player.silver < cost
                }
                onClick={() => act({ type: "upgrade", id: i.id })}
              >
                <Icon name="hammer" size={16} />
                {s.location !== "smith"
                  ? "请前往铁匠铺强化"
                  : level >= 5
                    ? "已达本篇强化上限"
                    : "请邵远山重铸"}
              </Button>
            </Section>
          )}
        </>
      )}
      {i.id === "medicine" && (
        <Button
          kind="ink"
          className="full"
          disabled={s.inventory.medicine < 1 || s.player.hp >= derived(s).maxHp}
          onClick={() => act({ type: "use", id: i.id })}
        >
          服用 · 恢复 65 气血
        </Button>
      )}
      {i.id !== "medicine" && i.kind !== "装备" && (
        <p className="selection-note">
          {i.id === "rope" || i.id === "cloth"
            ? "在战后拘捕界面使用。"
            : i.id === "charm"
              ? "在后巷追踪时使用。"
              : i.id === "iron"
                ? "在铁匠铺强化武器时使用。"
                : i.id === "key"
                  ? "在后巷探索事件中使用。"
                  : "可在对应人物的详情中赠送，或在事件中使用。"}
        </p>
      )}
      <div className="inline-feedback" role="status">
        {s.lastMessage}
      </div>
    </Modal>
  );
}
