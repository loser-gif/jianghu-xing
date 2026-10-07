import { useState } from "react";
import { useGame } from "../store";
import { origins, talents } from "../data/world";
import { Icon, Portrait, Seal, Button, Section } from "../components/UI";

export function Creation({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: () => void;
}) {
  const start = useGame((x) => x.start),
    old = useGame((x) => x.game.started);
  const [name, setName] = useState("沈辞"),
    [origin, setOrigin] = useState("escort"),
    [chosen, setChosen] = useState(["careful", "sword"]),
    [weapon, setWeapon] = useState("剑");
  const o = origins.find((o) => o.id === origin)!;
  return (
    <div className="creation-page">
      <button className="text-button" onClick={onBack}>
        <Icon name="back" size={16} />
        返回
      </button>
      <div className="creation-layout">
        <aside className="creation-art">
          <Portrait size="hero" />
          <div>
            <Seal>初入江湖</Seal>
            <h1>落笔之前</h1>
            <p>
              你从何处来，
              <br />
              又将往何处去。
            </p>
          </div>
        </aside>
        <section aria-label="创建角色">
          <div className="eyebrow">第一卷 · 烟雨初逢</div>
          <h2>
            写下你的故事 <Seal>缘起</Seal>
          </h2>
          <p className="muted">先写下你的名字，再去遇见这座江湖。</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (chosen.length !== 2 || !name.trim()) return;
              start(name, origin, chosen, weapon);
              onDone();
            }}
          >
            <Section title="江湖名姓">
              <div className="name-input">
                <input
                  aria-label="角色姓名"
                  value={name}
                  maxLength={12}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="请留下你的名字"
                />
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    setName(
                      [
                        "沈辞",
                        "顾长风",
                        "林照晚",
                        "叶知秋",
                        "苏望舒",
                        "陆听澜",
                      ][Math.floor(Math.random() * 6)],
                    )
                  }
                >
                  <Icon name="reset" size={16} />
                  随缘
                </button>
              </div>
            </Section>
            <Section
              title="来时身世"
              aside={<span className="small muted">出身会影响你的江湖</span>}
            >
              <div className="origin-grid">
                {origins.map((x) => (
                  <button
                    type="button"
                    key={x.id}
                    onClick={() => setOrigin(x.id)}
                    className={origin === x.id ? "selected" : ""}
                  >
                    <Icon
                      name={
                        x.id === "scholar"
                          ? "book"
                          : x.id === "hunter"
                            ? "footprints"
                            : x.id === "monk"
                              ? "circle"
                              : "sword"
                      }
                      size={19}
                    />
                    {x.name}
                    {origin === x.id && <Icon name="check" size={13} />}
                  </button>
                ))}
              </div>
              <p className="selection-note">{o.description}</p>
            </Section>
            <Section
              title="天赋禀性"
              aside={
                <span className="small muted">
                  择二而行 · {chosen.length}/2
                </span>
              }
            >
              <div className="talent-grid">
                {talents.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    className={chosen.includes(t.id) ? "selected" : ""}
                    onClick={() =>
                      setChosen(
                        chosen.includes(t.id)
                          ? chosen.filter((x) => x !== t.id)
                          : chosen.length < 2
                            ? [...chosen, t.id]
                            : chosen,
                      )
                    }
                  >
                    <span>
                      <b>{t.name}</b>
                      <small>{t.description}</small>
                    </span>
                    <span className="checkbox">
                      {chosen.includes(t.id) && <Icon name="check" size={12} />}
                    </span>
                  </button>
                ))}
              </div>
            </Section>
            <Section title="兵器倾向">
              <div className="tabs weapon-tabs">
                {["剑", "刀", "拳掌", "奇门"].map((w) => (
                  <button
                    type="button"
                    key={w}
                    onClick={() => setWeapon(w)}
                    className={weapon === w ? "active" : ""}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </Section>
            <div className="creation-stats">
              {(
                [
                  ["root", "根骨", 60],
                  ["insight", "悟性", 62],
                  ["agility", "身法", 60],
                  ["spirit", "心性", 60],
                ] as const
              ).map(([key, label, n]) => (
                <div key={key}>
                  <span>{label}</span>
                  <strong>{n + (o.stats[key] || 0)}</strong>
                </div>
              ))}
            </div>
            <Button
              type="submit"
              kind="ink"
              className="full"
              disabled={chosen.length !== 2 || !name.trim()}
            >
              踏入江湖 <Icon name="right" size={17} />
            </Button>
            {old && (
              <p className="small muted">
                开启新故事前，会自动保留当前进度至“上一段江湖”。
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
