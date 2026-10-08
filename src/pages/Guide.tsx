import type { GameState, Page } from "../types";
import { useGame } from "../store";
import { recommend } from "../engine/guidance";
import { Button, Icon } from "../components/UI";
export function NextStep({
  s,
  navigate,
  showFull = true,
}: {
  showFull?: boolean;
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const r = recommend(s),
    act = useGame((x) => x.act);
  return (
    <section className="next-step" aria-label="建议下一步">
      <div>
        <span className="eyebrow">江湖路引 · 随时可自由行动</span>
        <h2>{r.title}</h2>
        <p>{r.text}</p>
      </div>
      <div className="progression-buttons">
        {(showFull || r.page !== "guide") && (
          <Button
            kind="ink"
            onClick={() => {
              if (r.destination) act({ type: "move", id: r.destination });
              if (r.heal) act({ type: "heal" });
              navigate(r.page);
            }}
          >
            {r.button}
          </Button>
        )}
        {showFull && r.page !== "guide" && (
          <Button onClick={() => navigate("guide")}>完整指引</Button>
        )}
      </div>
    </section>
  );
}
const routes: {
  title: string;
  icon: string;
  page: Page;
  text: string;
  button: string;
}[] = [
  {
    title: "我要变强",
    icon: "book",
    page: "arts",
    text: "修习已学武学 → 积累修为 → 查看突破条件。内功帮助调息，轻功帮助闪避，出战招式决定主要攻击。",
    button: "查看武学与修为",
  },
  {
    title: "我要闯塔",
    icon: "building",
    page: "trial",
    text: "西湖试炼塔共30层，每5层有守关人。首通获精铁、银两、修为和试炼印；守关首通另获潜能。",
    button: "查看楼层与奖励",
  },
  {
    title: "我要配装备",
    icon: "bag",
    page: "inventory",
    text: "点击物品看详情和换装对比。青锋剑配清风十三剑；布衣与行云靴有套装加成。到铁匠铺可强化装备至+5。",
    button: "整理行囊",
  },
  {
    title: "我要认识人物",
    icon: "users",
    page: "npc",
    text: "先查人物所在地，再当面交谈、赠礼或请教。客栈、药庐和铁匠铺有三段委托；选择会留下记忆。",
    button: "打开人物谱",
  },
  {
    title: "我要当捕快",
    icon: "shield",
    page: "identity",
    text: "前往官府入职 → 接盗案 → 准备2条绳索与1条布条 → 按线索追踪。接案后才开始计算八日时限。",
    button: "查看身份与入职",
  },
  {
    title: "我要看看去哪里",
    icon: "map",
    page: "map",
    text: "地图选地点后点击「动身前往」。药庐疗伤、铁匠铺买装备、客栈打听消息；移动消耗一个时辰。",
    button: "打开天下舆图",
  },
];
export function Guide({
  s,
  navigate,
}: {
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const checks = [
    ["检查初始行装", !!s.flags.guide_equip],
    ["完成一次武学修习", !!s.flags.guide_practice],
    ["通关试炼塔第一层", s.trial.highest > 0],
    ["强化任意一件装备", Object.values(s.upgrades).some((n) => n > 0)],
    ["完成一次境界突破", s.cultivation.realm > 0],
  ] as const;
  return (
    <div className="guide-page">
      <NextStep s={s} navigate={navigate} showFull={false} />
      <section className="guide-start">
        <h2>第一次玩，先做这五件事</h2>
        <p>这是推荐顺序，不会锁住其他玩法。已完成的事自动打勾。</p>
        <ol>
          {checks.map(([title, done], i) => (
            <li key={title} className={done ? "done" : ""}>
              <span>{done ? "✓" : String(i + 1).padStart(2, "0")}</span>
              {title}
            </li>
          ))}
        </ol>
      </section>
      <div className="guide-routes">
        {routes.map((r) => (
          <article key={r.page}>
            <Icon name={r.icon} />
            <h2>{r.title}</h2>
            <p>{r.text}</p>
            <Button onClick={() => navigate(r.page)}>{r.button}</Button>
          </article>
        ))}
      </div>
      <section className="guide-glossary">
        <h2>几个容易混淆的数值</h2>
        <dl>
          <dt>气血 / 内力</dt>
          <dd>
            气血归零会落败；内力用于招式，战斗中可防御调息。药庐可恢复两者。
          </dd>
          <dt>修为 / 境界</dt>
          <dd>修为是突破资源，境界是长期实力等级。条件满足后要手动突破。</dd>
          <dt>武学熟练度</dt>
          <dd>
            每门武学各自积累，通过修习和实战提高。武学突破与人物破境是两件事。
          </dd>
          <dt>试炼印 / 潜能</dt>
          <dd>
            试炼印兑换补给、装备和轻功；每5层守关首通获4点潜能，在人物页分配基础属性。
          </dd>
          <dt>时间 / 存档</dt>
          <dd>
            切换页面、看装备不消耗时间；移动、修习、开始闯塔会消耗。每次行动自动保存，退出后从主菜单继续；换设备请先导出存档。
          </dd>
        </dl>
      </section>
      <section className="guide-start">
        <h2>为什么有些按钮不能点？</h2>
        <p>
          学武需要人物在场、银两或关系达标；战斗招式需要内力；塔层需要先通关前层；装备强化需要身处铁匠铺、精铁和银两。请看对应按钮旁的条件说明。
        </p>
        <p className="small muted">
          本轮开放杭州探索、试炼塔、装备武学成长与捕快身份。采集生产、加入或自创宗门、更多朝廷官阶仍在后续计划中。
        </p>
      </section>
    </div>
  );
}
