import { useState } from "react";
import { useGame } from "../store";
import { origins, talents, items, arts, npcs } from "../data/world";
import { createCharacter, derived } from "../engine/game";
import { Icon, Seal, Button, Section } from "../components/UI";
import { PlayerPortrait } from "../components/PlayerPortrait";

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
    [gender, setGender] = useState<"male" | "female">("male");
  const [origin, setOrigin] = useState("escort"),
    [chosen, setChosen] = useState(["careful", "sword"]),
    [weapon, setWeapon] = useState("剑"),
    [step, setStep] = useState(0);
  const o = origins.find((x) => x.id === origin)!;
  const preview = createCharacter(name, origin, chosen, weapon, gender),
    d = derived(preview);
  const next = () => {
    setStep((x) => Math.min(2, x + 1));
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <div className={`creation-page creation-v2 creation-step-${step}`}>
      <button className="text-button" onClick={onBack}>
        <Icon name="back" size={16} />
        返回
      </button>
      <nav className="creation-steps" aria-label="创建进度">
        {["名姓形貌", "身世禀赋", "行前确认"].map((label, i) => (
          <button
            key={label}
            aria-current={step === i ? "step" : undefined}
            disabled={i > step}
            onClick={() => setStep(i)}
          >
            <b>0{i + 1}</b>
            {label}
          </button>
        ))}
      </nav>
      <div className="creation-layout">
        <aside className="creation-art">
          <PlayerPortrait gender={gender} full />
          <div className="creation-caption">
            <Seal>初入江湖</Seal>
            <h2>{name || "无名行客"}</h2>
            <p>{o.name} · 入不流</p>
          </div>
        </aside>
        <section aria-label="创建角色">
          <span className="eyebrow">第一卷 · 烟雨初逢</span>
          <h2>
            {
              [
                "此间少年，落笔有名",
                "来路不同，江湖同归",
                "带上这些，踏入江湖",
              ][step]
            }
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim() || (step > 0 && chosen.length !== 2)) return;
              if (step < 2) next();
              else {
                start(name, origin, chosen, weapon, gender);
                onDone();
              }
            }}
          >
            {step === 0 && (
              <>
                <Section title="人物形貌">
                  <div className="gender-select">
                    {(["male", "female"] as const).map((g) => (
                      <button
                        type="button"
                        aria-pressed={gender === g}
                        className={gender === g ? "selected" : ""}
                        key={g}
                        onClick={() => setGender(g)}
                      >
                        <span>{g === "male" ? "少侠" : "女侠"}</span>
                        <small>{g === "male" ? "墨衣行远" : "青衣听雨"}</small>
                      </button>
                    ))}
                  </div>
                  <p className="small muted">
                    形貌只影响画像，男女属性、武学与故事机会相同。
                  </p>
                </Section>
                <Section title="江湖名姓">
                  <div className="name-input">
                    <input
                      aria-label="角色姓名"
                      maxLength={12}
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="留下你的名字"
                    />
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        setName(
                          ["沈辞", "林照晚", "叶知秋", "苏望舒", "陆听澜"][
                            Math.floor(Math.random() * 5)
                          ],
                        )
                      }
                    >
                      随缘取名
                    </button>
                  </div>
                </Section>
                <p className="creation-poem">
                  风从衣上过，山在眉间远。
                  <br />
                  今夜之前，江湖尚不识你。
                </p>
              </>
            )}
            {step === 1 && (
              <>
                <Section title="来时身世">
                  <div className="origin-grid">
                    {origins.map((x) => (
                      <button
                        type="button"
                        key={x.id}
                        aria-pressed={origin === x.id}
                        onClick={() => setOrigin(x.id)}
                        className={origin === x.id ? "selected" : ""}
                      >
                        {x.name}
                      </button>
                    ))}
                  </div>
                  <p className="selection-note">{o.description}</p>
                </Section>
                <Section
                  title="天赋禀性"
                  aside={<span>择二 · {chosen.length}/2</span>}
                >
                  <div className="talent-grid">
                    {talents.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        aria-pressed={chosen.includes(t.id)}
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
                          {chosen.includes(t.id) && (
                            <Icon name="check" size={12} />
                          )}
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
                        aria-pressed={weapon === w}
                        onClick={() => setWeapon(w)}
                        className={weapon === w ? "active" : ""}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </Section>
              </>
            )}
            {step === 2 && (
              <>
                <p className="selection-note">
                  {name} · {gender === "female" ? "女侠" : "少侠"} · {o.name}
                  <br />
                  初始境界：入不流。由此积修为、悟武学，踏上自己的修行之路。
                </p>
                <Section title="实际初始属性">
                  <div className="creation-stats">
                    {[
                      ["气血", d.maxHp],
                      ["内力", d.maxQi],
                      ["外功", d.attack],
                      ["防御", d.defense],
                    ].map(([label, n]) => (
                      <div key={label}>
                        <span>{label}</span>
                        <strong>{n}</strong>
                      </div>
                    ))}
                  </div>
                  <p>
                    根骨 {preview.player.stats.root} · 悟性{" "}
                    {preview.player.stats.insight} · 身法{" "}
                    {preview.player.stats.agility} · 心性{" "}
                    {preview.player.stats.spirit}
                  </p>
                </Section>
                <Section title="行装与传承">
                  <p>银两 {preview.player.silver} 两</p>
                  <p>
                    装备：
                    {Object.values(preview.equipped)
                      .map((id) => items.find((i) => i.id === id)?.name)
                      .join("、")}
                  </p>
                  <p>
                    武学：
                    {Object.keys(preview.arts)
                      .map((id) => arts.find((a) => a.id === id)?.name)
                      .join("、")}
                  </p>
                  <p>随身：金疮药 ×2、青灵草 ×2、精铁 ×2</p>
                  <p>
                    旧识：
                    {npcs
                      .filter((n) => preview.relationships[n.id].met)
                      .map((n) => n.name)
                      .join("、") || "尚无人相识，前路皆是初逢"}
                  </p>
                </Section>
                {old && (
                  <p className="small muted">
                    开启新故事会将当前进度保留至“上一段江湖”。
                  </p>
                )}
              </>
            )}
            <div className="creation-controls">
              {step > 0 && (
                <Button onClick={() => setStep((x) => x - 1)}>上一步</Button>
              )}
              <Button
                type="submit"
                kind="ink"
                disabled={!name.trim() || (step > 0 && chosen.length !== 2)}
              >
                {step === 2 ? "踏入江湖" : "下一步"}
                <Icon name="right" size={17} />
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
