import { useGame } from "../store";
import { Icon, Portrait, Seal, Button, Modal } from "../components/UI";
import type { GameState } from "../types";

export function Custody({ s }: { s: GameState }) {
  const act = useGame((x) => x.act);
  return (
    <Modal title="战后处置 · 非致命拘捕">
      <div className="custody-heading">
        <Portrait index={5} />
        <div>
          <h2>顾红绫</h2>
          <span className="relation-tag">已完全失去战力</span>
        </div>
        <Seal>活捉</Seal>
      </div>
      <p className="prose">
        兵刃已落，交锋已止。完成三项控制后，才能安全押送。
      </p>
      <div className="controls-grid">
        {[
          ["hands", "手部控制", "绳索", "hand"],
          ["legs", "腿部控制", "绳索", "footprints"],
          ["alert", "示警控制", "布条", "shield"],
        ].map(([id, label, tool, icon]) => {
          const done = s.quest.controls.includes(id);
          const count = s.inventory[id === "alert" ? "cloth" : "rope"] || 0;
          return (
            <button
              key={id}
              disabled={done || count < 1}
              className={done ? "done" : ""}
              onClick={() => act({ type: "control", id })}
            >
              <Icon name={done ? "check" : icon} size={26} />
              <b>{label}</b>
              <small>{done ? "已完成" : `${tool} ×1 · 持有 ${count}`}</small>
            </button>
          );
        })}
      </div>
      <div className="button-row">
        <Button
          disabled={!(s.inventory.medicine > 0) || !!s.flags.healed_gu}
          onClick={() => act({ type: "dispose", id: "heal" })}
        >
          先行救治 · 金疮药 ×1
        </Button>
        <Button
          disabled={!!s.flags.searched_gu}
          onClick={() => act({ type: "dispose", id: "search" })}
        >
          搜寻失窃物证
        </Button>
      </div>
      <div className="risky-actions">
        <button
          className="text-button"
          onClick={() => act({ type: "dispose", id: "release" })}
        >
          放走目标 · 任务失败
        </button>
        <button
          className="text-button"
          onClick={() => act({ type: "dispose", id: "escortPartial" })}
        >
          控制未全便押送 · 目标会逃脱
        </button>
      </div>
      <div className="inline-feedback" role="status">
        {s.lastMessage}
      </div>
    </Modal>
  );
}
