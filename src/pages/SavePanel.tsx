import { useState, useRef } from "react";
import { useGame } from "../store";
import { timeLabel } from "../data/world";
import { Icon, Button, Modal } from "../components/UI";
import { readSave } from "../engine/storage";

export function SavePanel({
  onClose,
  onLoaded,
  onMenu,
}: {
  onClose: () => void;
  onLoaded: () => void;
  onMenu: () => void;
}) {
  const { game: s, save, load, importSave, storageError } = useGame();
  const [revision, setRevision] = useState(0),
    [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    kind: "load" | "save";
    slot: string;
  } | null>(null);
  const slots = ["auto", "1", "2", "3", "previous"];
  const records = slots.map((slot) => {
    try {
      return { slot, record: readSave(slot), error: false };
    } catch {
      return { slot, record: null, error: true };
    }
  });
  const download = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { version: 1, savedAt: new Date().toISOString(), state: s },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `江湖行-${s.player.name}-存档.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMessage("存档已导出。妥善留存，便可在别处续写。");
  };
  const label = (slot: string) =>
    slot === "auto"
      ? "自动存档"
      : slot === "previous"
        ? "上一段江湖"
        : `手动存档 · ${["", "壹", "贰", "叁"][Number(slot)]}`;
  const confirm = () => {
    if (!pending) return;
    if (pending.kind === "load") {
      if (load(pending.slot)) onLoaded();
    } else {
      if (save(pending.slot)) {
        setMessage("此刻的江湖，已收进卷中。");
        setRevision(revision + 1);
      }
    }
    setPending(null);
  };
  return (
    <Modal title="存档与设置" onClose={onClose}>
      <p className="muted small">
        每次行动自动保存。手动存档可保留故事分岔前的时刻。
      </p>
      <div className="save-slots">
        {records.map(({ slot, record, error }) => (
          <div key={slot}>
            <Icon name="scroll" size={24} />
            <span>
              <b>{label(slot)}</b>
              <small>
                {error
                  ? "存档损坏 · 可用导入恢复"
                  : record
                    ? `${record.state.player.name} · ${timeLabel(record.state.time)}`
                    : "尚未落笔"}
              </small>
              {record && (
                <small>
                  {new Date(record.savedAt).toLocaleString("zh-CN")}
                </small>
              )}
            </span>
            <div>
              {["1", "2", "3"].includes(slot) && (
                <Button
                  disabled={!s.started}
                  onClick={() => {
                    if (record) setPending({ kind: "save", slot });
                    else if (save(slot)) {
                      setMessage("已保存。");
                      setRevision(revision + 1);
                    }
                  }}
                >
                  保存
                </Button>
              )}
              <Button
                disabled={!record}
                onClick={() => setPending({ kind: "load", slot })}
              >
                读取
              </Button>
            </div>
          </div>
        ))}
      </div>
      {pending && (
        <div className="save-confirm">
          <p>
            {pending.kind === "load"
              ? "读取此存档会替换当前自动进度。请确认已保存需要保留的故事。"
              : "这个存档位已有故事。是否用当前进度覆盖？"}
          </p>
          <Button onClick={() => setPending(null)}>取消</Button>
          <Button kind="ink" onClick={confirm}>
            确认{pending.kind === "load" ? "读取" : "覆盖"}
          </Button>
        </div>
      )}
      <div className="button-row">
        <Button disabled={!s.started} onClick={download}>
          <Icon name="download" size={16} />
          导出存档
        </Button>
        <Button onClick={() => input.current?.click()}>
          <Icon name="upload" size={16} />
          导入存档
        </Button>
      </div>
      <input
        type="file"
        accept=".json,application/json"
        hidden
        ref={input}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 2_000_000) {
            setMessage("文件过大，请选择有效的江湖行存档。");
            return;
          }
          const raw = await f.text();
          if (importSave(raw)) onLoaded();
          e.target.value = "";
        }}
      />
      <p className="small muted">
        导入前会备份当前故事。存档保存在本浏览器；清理浏览器数据可能移除进度，建议定期导出。
      </p>
      <div className="inline-feedback" role="status">
        {storageError || message}
      </div>
      <Button className="full" onClick={onMenu}>
        返回主菜单
      </Button>
    </Modal>
  );
}
