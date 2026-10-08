import { useState } from "react";
import type { GameState, Page } from "../types";
import { useGame } from "../store";
import {
  calendar,
  lifeInfo,
  timedCase,
  lifespanByRealm,
} from "../engine/calendar";
import { realms } from "../engine/cultivation";
import { timeLabel } from "../data/world";
import { Button } from "../components/UI";
export function LifeReadout({ s }: { s: GameState }) {
  const l = lifeInfo(s);
  return (
    <div className="life-readout">
      <span>
        年龄 <b>{l.age}岁</b>
      </span>
      <span>
        寿元 <b>{l.lifespan}岁</b>
      </span>
      <span>
        {s.life.ended
          ? "此生已结卷"
          : `余寿约${Math.floor(l.remainingDays / 360)}年${l.remainingDays % 360}日`}
      </span>
    </div>
  );
}
export function LifeEnding({
  s,
  navigate,
  onSave,
  onMenu,
}: {
  s: GameState;
  navigate: (p: Page) => void;
  onSave: () => void;
  onMenu: () => void;
}) {
  if (!s.life.ended) return null;
  return (
    <section className="life-ending" role="status">
      <span className="eyebrow">一纸江湖 · 此生留痕</span>
      <h2>{s.player.name}的一生</h2>
      <p>
        享年{lifeInfo(s).lifespan}岁，止于{realms[s.cultivation.realm]}
        。通关试炼{s.trial.highest}层，交付生活订单{s.living.delivered}笔。
      </p>
      <p>
        此生停止推进，人物、行囊与手记完整保留。开启新角色前可导出纪念存档。
      </p>
      <div className="progression-buttons">
        <Button onClick={() => navigate("journal")}>回看江湖手记</Button>
        <Button onClick={onSave}>导出 / 管理存档</Button>
        <Button onClick={onMenu}>返回主菜单</Button>
      </div>
    </section>
  );
}
export function CalendarPage({
  s,
  navigate,
}: {
  s: GameState;
  navigate: (p: Page) => void;
}) {
  const act = useGame((x) => x.act),
    [days, setDays] = useState(7),
    [confirm, setConfirm] = useState(false);
  const l = lifeInfo(s),
    after = calendar(s.time + days * 6);
  const gain =
    s.cultivation.realm === 14
      ? 0
      : Math.floor((days * 20) / (1 + Math.floor(s.cultivation.realm / 3)));
  return (
    <div className="calendar-page">
      <section className="calendar-hero">
        <span className="eyebrow">岁序有常 · 行迹有年</span>
        <h2>{timeLabel(s.time)}</h2>
        <LifeReadout s={s} />
        <p>
          你踏入江湖时{s.life.startAge}岁。
          {s.life.ended
            ? "此生记录已封存，时间不再推进。"
            : `距离下次生辰约${l.nextBirthdayDays}日，生辰按入江湖之日计算。`}
        </p>
      </section>
      <section className="life-section">
        <h2>时间怎样流逝</h2>
        <p>
          一年十二月，每月三十日。一日六个时段，每段两时辰（四小时）。移动、采集、制作和一般修习推进一个时段；买卖、换装、查看页面不耗时。
        </p>
        <p>
          <strong>离线、暂停、停留页面都不会变老。</strong>
          试炼入场计时，交锋中的回合不会额外推进日历。八日缉捕期限与人物昼夜日程仍使用同一份时间。
        </p>
      </section>
      {!s.life.ended && (
        <section className="life-section">
          <h2>安排闭关</h2>
          <p>
            快速度过一段游戏时间，积累修为与恢复内力。闭关不会自动突破，也不会自动完成订单。
          </p>
          <div className="calendar-durations">
            {[1, 7, 30, 360].map((n) => (
              <button
                key={n}
                aria-pressed={days === n}
                onClick={() => {
                  setDays(n);
                  setConfirm(false);
                }}
              >
                {n === 360 ? "一年" : `${n}日`}
              </button>
            ))}
          </div>
          <div className="retreat-preview">
            <p>
              预计修为 +{gain} · 到大胤{after.year}年{after.month}月{after.day}
              日
            </p>
            <p>
              闭关后约
              {l.age +
                Math.floor(
                  (((s.time - s.life.startAt) % 2160) + days * 6) / 2160,
                )}
              岁 ·{" "}
              {days >= l.remainingDays
                ? "这次闭关将抵达寿命终点，进入人生结算，未完成闭关不获得收益。"
                : `消耗余寿${days}日。`}
            </p>
          </div>
          {confirm ? (
            <div className="progression-buttons">
              <Button
                kind="ink"
                disabled={s.life.ended || timedCase(s)}
                onClick={() => {
                  act({ type: "seclusion", days });
                  setConfirm(false);
                }}
              >
                确认闭关{days}日
              </Button>
              <Button onClick={() => setConfirm(false)}>暂不闭关</Button>
            </div>
          ) : (
            <Button
              disabled={s.life.ended || timedCase(s)}
              onClick={() => setConfirm(true)}
            >
              安排这次闭关
            </Button>
          )}
          {timedCase(s) && <p>请先处理手头的案件，避免长期闭关错过期限。</p>}
          <Button onClick={() => navigate("arts")}>查看修为与突破条件</Button>
        </section>
      )}
      <section className="life-section">
        <h2>境界与寿元</h2>
        <p>
          寿元为当前境界的寿命上限，并非每次突破叠加整段年数。自然增龄不直接削弱基础属性；寿尽时结算并保留存档。
        </p>
        <div className="lifespan-table">
          {realms.map((name, i) => (
            <div
              key={name}
              className={i === s.cultivation.realm ? "active" : ""}
            >
              <span>{name}</span>
              <b>{lifespanByRealm[i]}岁</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
