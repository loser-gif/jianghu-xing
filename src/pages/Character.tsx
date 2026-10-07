import { ItemArt } from "../components/Reference";
import { origins, talents, items } from "../data/world";
import { Icon, Portrait, Seal, Section, Meter } from "../components/UI";
import type { GameState, Page, Item } from "../types";
import { derived } from "../engine/game";

export function Character({
  s,
  navigate,
  onItem,
}: {
  s: GameState;
  navigate: (p: Page) => void;
  onItem: (i: Item) => void;
}) {
  const d = derived(s);
  return (
    <>
      <div className="character-hero">
        <Portrait size="hero" />
        <div>
          <span className="eyebrow">江南行客</span>
          <h1>
            {s.player.name}
            <Seal>{s.identity.rank ? "捕" : "侠"}</Seal>
          </h1>
          <p>
            {origins.find((o) => o.id === s.player.origin)?.name} ·{" "}
            {s.player.weapon}道初行
          </p>
          <blockquote>
            千山万水，
            <br />
            你自有你的去处。
          </blockquote>
          <div className="person-tags">
            {s.player.talents.map((t) => (
              <span key={t}>{talents.find((x) => x.id === t)?.name}</span>
            ))}
          </div>
        </div>
      </div>
      <Section title="根骨心性">
        <div className="attribute-grid">
          {(
            [
              ["root", "根骨"],
              ["insight", "悟性"],
              ["agility", "身法"],
              ["spirit", "心性"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <span>{label}</span>
              <strong>{s.player.stats[key]}</strong>
              <i>
                <b style={{ width: `${s.player.stats[key]}%` }} />
              </i>
            </div>
          ))}
        </div>
      </Section>
      <Section title="行走底气">
        <Meter label="气血" value={s.player.hp} max={d.maxHp} color="red" />
        <Meter label="内力" value={s.player.qi} max={d.maxQi} />
        <div className="stat-strip">
          <div>
            外功<strong>{d.attack}</strong>
          </div>
          <div>
            防御<strong>{d.defense}</strong>
          </div>
          <div>
            名望<strong>{s.player.fame}</strong>
          </div>
          <div>
            善恶<strong>{s.player.morality}</strong>
          </div>
        </div>
      </Section>
      <Section
        title="随身装备"
        aside={
          <button className="text-button" onClick={() => navigate("inventory")}>
            行囊 <Icon name="right" size={13} />
          </button>
        }
      >
        <div className="equipped-grid">
          {[
            ["weapon", "兵器"],
            ["armor", "衣甲"],
            ["feet", "足部"],
          ].map(([slot, label]) => {
            const item = items.find((i) => i.id === s.equipped[slot]);
            return (
              <button
                key={slot}
                onClick={() => (item ? onItem(item) : navigate("inventory"))}
              >
                {item ? (
                  <ItemArt icon={item.icon} itemId={item.id} />
                ) : (
                  <div className="empty-equipment-art" aria-hidden="true">
                    <Icon
                      name={
                        slot === "feet"
                          ? "footprints"
                          : slot === "armor"
                            ? "shirt"
                            : "sword"
                      }
                      size={32}
                    />
                  </div>
                )}
                <span>
                  <small>{label}</small>
                  <b>
                    {item?.name || "尚未装备"}
                    {s.upgrades[item?.id || ""]
                      ? ` +${s.upgrades[item!.id]}`
                      : ""}
                  </b>
                </span>
              </button>
            );
          })}
        </div>
        {d.set && (
          <p className="selection-note">行云两件套已生效 · 气血上限 +30</p>
        )}
      </Section>
      <div className="destination-list">
        <button onClick={() => navigate("npc")}>
          <Icon name="users" />
          <span>人物谱与羁绊</span>
          <Icon name="right" size={15} />
        </button>
        <button onClick={() => navigate("identity")}>
          <Icon name="shield" />
          <span>身份司簿</span>
          <Icon name="right" size={15} />
        </button>
        <button onClick={() => navigate("journal")}>
          <Icon name="feather" />
          <span>江湖手记</span>
          <Icon name="right" size={15} />
        </button>
      </div>
    </>
  );
}
