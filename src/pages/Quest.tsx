import { CommissionBoard } from "../components/Progression";
import { useGame } from "../store";
import { locations, items, stageLabels, questSteps } from "../data/world";
import {
  Icon,
  Portrait,
  Seal,
  Button,
  Section,
  ActionRow,
} from "../components/UI";
import type { GameState, Page } from "../types";

export function Quest({
  s,
  navigate,
}: {
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const act = useGame((x) => x.act);
  const st = s.quest.stage;
  const step =
    st === "prepare"
      ? 0
      : st === "investigate"
        ? 1
        : st === "trail"
          ? 2
          : ["dock", "combat"].includes(st)
            ? 3
            : st === "defeated"
              ? 4
              : 5;
  const travel = (id: string) => {
    act({ type: "move", id });
    navigate("jianghu");
  };
  return (
    <>
      <CommissionBoard s={s} navigate={navigate} />
      <div className="case-heading">
        <div>
          <span className="eyebrow">杭州官府 · 缉捕案卷 · 壹</span>
          <h1>
            烟雨楼盗案 <Seal>活捉</Seal>
          </h1>
          <p>烟雨楼一夜失窃，绯衣人踏水而去。</p>
        </div>
        <span className={`relation-tag ${st === "completed" ? "green" : ""}`}>
          {stageLabels[st]}
        </span>
      </div>
      <div className="wanted-profile">
        <Portrait index={5} size="large" />
        <div>
          <span className="small muted">通缉目标</span>
          <h2>
            顾红绫 <span className="gender red">女</span>
          </h2>
          <p>案由 · 盗窃　要求 · 活捉</p>
          <div className="wanted-reward">
            <span>
              赏银 <b>300</b> 两
            </span>
            <span>
              危险 <b className="red-text">◆◆◆◇◇</b>
            </span>
          </div>
        </div>
      </div>
      <p className="prose">
        烟雨楼失窃玉佩一枚。目击者称，绯衣女子自后门离去，轻功了得。查明行踪，将其活捉归案，勿伤无辜。
      </p>
      {["locked", "available"].includes(st) ? (
        <div className="quest-accept">
          <p>
            {st === "locked"
              ? "先拜见陆捕头，成为捕快后即可接取此案。"
              : "陆捕头已备好案卷。接案后须在八日内找到目标，先做好行前准备。"}
          </p>
          <Button
            kind="ink"
            onClick={() =>
              s.location !== "office"
                ? travel("office")
                : st === "locked"
                  ? navigate("identity")
                  : act({ type: "accept" })
            }
          >
            {s.location !== "office"
              ? "前往官府"
              : st === "locked"
                ? "入职捕快"
                : "接取缉捕任务"}
            <Icon name="right" size={16} />
          </Button>
        </div>
      ) : (
        <>
          <Section title="缉捕行程">
            <div className="quest-timeline">
              {questSteps.map((label, i) => (
                <div
                  key={label}
                  className={`${i < step ? "done" : ""} ${i === step ? "current" : ""}`}
                >
                  <span>
                    {i < step ? <Icon name="check" size={13} /> : i + 1}
                  </span>
                  <b>{label}</b>
                </div>
              ))}
            </div>
            {![
              "completed",
              "failed",
              "captured",
              "defeated",
              "combat",
            ].includes(st) && (
              <p className="small muted">
                剩余追缉时间：{Math.max(0, 48 - (s.time - s.quest.acceptedAt))}{" "}
                个时辰 · 截止前须找到目标
              </p>
            )}
          </Section>
          {st === "prepare" && (
            <Section title="行前准备">
              <div className="prep-list">
                {[
                  ["rope", 2],
                  ["cloth", 1],
                  ["medicine", 1],
                ].map(([id, n]) => {
                  const item = items.find((i) => i.id === id)!;
                  return (
                    <div key={id}>
                      <Icon name={item.icon} size={23} />
                      <span>
                        <b>{item.name}</b>
                        <small>
                          {id === "medicine" ? "建议携带" : "必备物品"} · 已有{" "}
                          {s.inventory[String(id)] || 0} / {n}
                        </small>
                      </span>
                      <span
                        className={
                          (s.inventory[String(id)] || 0) >= Number(n)
                            ? "green-text"
                            : "red-text"
                        }
                      >
                        <Icon
                          name={
                            (s.inventory[String(id)] || 0) >= Number(n)
                              ? "check"
                              : "circle"
                          }
                          size={18}
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="button-row">
                <Button
                  onClick={() => {
                    if (s.location !== "office") {
                      travel("office");
                      return;
                    }
                    const rope = Math.max(0, 2 - (s.inventory.rope || 0));
                    for (let i = 0; i < rope; i++)
                      act({ type: "buy", id: "rope" });
                    if (!(s.inventory.cloth > 0))
                      act({ type: "buy", id: "cloth" });
                  }}
                >
                  官府补齐工具
                </Button>
                <Button
                  kind="ink"
                  disabled={
                    (s.inventory.rope || 0) < 2 || (s.inventory.cloth || 0) < 1
                  }
                  onClick={() => act({ type: "prepare" })}
                >
                  检查完毕，出发
                </Button>
              </div>
            </Section>
          )}
          {st === "investigate" && (
            <ActionRow
              icon="search"
              title={s.location === "tower" ? "勘查失窃现场" : "前往烟雨楼"}
              description="询问目击者，查看窗棂与后门"
              onClick={() =>
                s.location === "tower"
                  ? act({ type: "investigate" })
                  : travel("tower")
              }
            />
          )}
          {st === "trail" &&
            (s.location !== "alley" ? (
              <ActionRow
                icon="footprints"
                title="前往后巷追踪"
                description="足迹从烟雨楼后门延伸进窄巷"
                onClick={() => travel("alley")}
              />
            ) : (
              <Section title="岔路之间">
                <p className="prose">
                  西巷留下清晰脚印，东面水边却有几滴未干的水渍。该往哪边追？
                </p>
                {(s.flags.trusted_clue ||
                  s.player.origin === "hunter" ||
                  s.player.talents.includes("careful")) && (
                  <p className="selection-note">
                    凭已有情报与观察，你能看出西巷脚印是刻意留下的。真正的去向是东边水路。
                  </p>
                )}
                <ActionRow
                  icon="search"
                  title="仔细比对足迹"
                  description="凭身世、天赋或可信情报辨路；否则花一个时辰勘察"
                  onClick={() => act({ type: "track", id: "observe" })}
                />
                <ActionRow
                  icon="boat"
                  title="沿东边水路追踪"
                  description="顺着湿绳与船痕，去往旧码头"
                  onClick={() => act({ type: "track", id: "east" })}
                />
                <ActionRow
                  icon="footprints"
                  title="沿西巷脚印追踪"
                  description="脚印清晰，但似乎有些刻意"
                  onClick={() => act({ type: "track", id: "west" })}
                />
                <ActionRow
                  icon="scroll"
                  title="使用追踪符"
                  description={`消耗一枚，辨明行踪 · 持有 ${s.inventory.charm || 0}`}
                  disabled={!(s.inventory.charm > 0)}
                  onClick={() => act({ type: "track", id: "charm" })}
                />
              </Section>
            ))}
          {st === "dock" && (
            <ActionRow
              icon="swords"
              title={s.location === "dock" ? "拦下顾红绫，交锋" : "前往旧码头"}
              description="她就在北侧仓房附近。准备好药物与武学。"
              onClick={() =>
                s.location === "dock"
                  ? act({ type: "confront" })
                  : travel("dock")
              }
            />
          )}
          {st === "captured" && (
            <Button
              kind="ink"
              className="full"
              onClick={() => act({ type: "turnin" })}
            >
              安全押送 · 返回官府结案
            </Button>
          )}
          {st === "completed" && (
            <div className="completion">
              <Seal>已结案</Seal>
              <h2>一桩案了，一段缘起</h2>
              <p>赏银 +300 两 · 捕快声望 +25 · 官府贡献 +40</p>
              <p className="muted">
                陆怀安记住了你的担当。苏婉娘也听说了这桩事，对你多了一份信任。
              </p>
              <Button onClick={() => navigate("identity")}>
                查看身份晋升 <Icon name="right" size={15} />
              </Button>
            </div>
          )}
          {st === "failed" && (
            <div className="failure">
              <h3>此番失利，江湖未尽</h3>
              <p>{s.quest.failure}</p>
              <p className="muted">
                失利记录会留下。休整、补齐工具后，可凭新线索再次追缉。
              </p>
              <Button
                onClick={() =>
                  s.location === "office"
                    ? act({ type: "retry" })
                    : travel("office")
                }
              >
                {s.location === "office" ? "领取新线索 · 5 两" : "回官府复命"}
              </Button>
            </div>
          )}
        </>
      )}
      {s.quest.clues.length > 0 && (
        <Section title="线索手札">
          <div className="clue-list">
            {s.quest.clues.map((c, i) => (
              <p key={i}>
                <span>〇{i + 1}</span>
                {c}
              </p>
            ))}
          </div>
        </Section>
      )}
      <Section title="案卷批注">
        <p className="small muted">
          先彻底击败目标，再完成手部、腿部、示警三项控制。拘捕成功后可直接押送归案。目标逃脱、战败或追缉超时会记入失利记录。
        </p>
      </Section>
    </>
  );
}
