import { professions, professionRank, rankNames } from "../data/living";
import { useGame } from "../store";
import { stageLabels } from "../data/world";
import { Icon, Button, Section, ActionRow } from "../components/UI";
import type { GameState, Page } from "../types";

export function Identity({
  s,
  navigate,
}: {
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const act = useGame((x) => x.act);
  const at = s.location === "office";
  return (
    <>
      <div className="identity-hero">
        <div className="official-seal">捕</div>
        <div>
          <span className="eyebrow">杭州官府</span>
          <h1>
            {s.identity.rank === 2
              ? "资深捕快"
              : s.identity.rank
                ? "捕快"
                : "江湖游侠"}
          </h1>
          <p>
            {s.identity.rank
              ? "一身公服，护一城安宁。"
              : "走进公门，也是一条江湖路。"}
          </p>
        </div>
      </div>
      <Section title="生活身份 · 可兼修">
        <div className="profession-summary">
          {professions.map((p) => (
            <p key={p.id}>
              {p.name} · {rankNames[professionRank(s.living.xp[p.id])]} · 熟练
              {s.living.xp[p.id]}
            </p>
          ))}
        </div>
        <Button onClick={() => navigate("living")}>采集、生产与生活订单</Button>
      </Section>
      <Section title="职业之路">
        <div className="career-path">
          {["捕快", "资深捕快", "总捕", "锦衣卫"].map((n, i) => (
            <div key={n} className={s.identity.rank === i + 1 ? "active" : ""}>
              <span>{i < 2 ? "捕" : "印"}</span>
              <b>{n}</b>
              <small>
                {i >= 2
                  ? "后续篇章"
                  : s.identity.rank === i + 1
                    ? "当前身份"
                    : s.identity.rank > i + 1
                      ? "已历任"
                      : "待晋升"}
              </small>
            </div>
          ))}
        </div>
      </Section>
      <Section title="司簿记录">
        <div className="stat-strip">
          <div>
            身份声望<strong>{s.identity.reputation}</strong>
          </div>
          <div>
            官府贡献<strong>{s.identity.contribution}</strong>
          </div>
          <div>
            缉捕成功<strong>{s.identity.wins}</strong>
          </div>
          <div>
            缉捕失利<strong>{s.identity.losses}</strong>
          </div>
        </div>
      </Section>
      <Section title="身份权益">
        <div className="rights-grid">
          {[
            ["scroll", "查看通缉"],
            ["search", "合法调查"],
            ["shield", "缉捕押送"],
            ["coins", "领取赏银"],
          ].map(([icon, t]) => (
            <div key={t}>
              <Icon name={icon} size={30} />
              <b>{t}</b>
            </div>
          ))}
        </div>
      </Section>
      {!s.identity.rank ? (
        <Button
          kind="ink"
          className="full"
          onClick={() => {
            if (!at) {
              act({ type: "move", id: "office" });
              navigate("jianghu");
            } else act({ type: "join" });
          }}
        >
          {at ? "接过腰牌，入职捕快" : "前往官府，拜见陆捕头"}
        </Button>
      ) : s.identity.rank === 1 ? (
        <>
          <p className="selection-note">
            晋升资深捕快：官府贡献 {s.identity.contribution}/40 · 身份声望{" "}
            {s.identity.reputation}/25
          </p>
          <Button
            kind="ink"
            className="full"
            disabled={
              at && (s.identity.contribution < 40 || s.identity.reputation < 25)
            }
            onClick={() => {
              if (!at) {
                act({ type: "move", id: "office" });
                navigate("jianghu");
              } else act({ type: "promote" });
            }}
          >
            {at ? "申请晋升 · 资深捕快" : "前往官府交验身份"}
          </Button>
        </>
      ) : (
        <p className="selection-note">
          你已晋升资深捕快，达到杭州篇的职业目标。总捕与锦衣卫之路，将在后续篇章展开。
        </p>
      )}
      <ActionRow
        icon="scroll"
        title="烟雨楼盗案"
        description={`当前进度：${stageLabels[s.quest.stage]}`}
        onClick={() => navigate("quest")}
      />
    </>
  );
}
