import { useState, useRef, useEffect } from "react";
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
  const confirmRef = useRef<HTMLElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [importing, setImporting] = useState(false);
  const [pending, setPending] = useState<{
    kind: "load" | "save";
    slot: string;
  } | null>(null);
  useEffect(() => {
    if (pending) {
      confirmRef.current?.focus({ preventScroll: true });
      confirmRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [pending]);
  useEffect(() => {
    if (message || storageError)
      statusRef.current?.scrollIntoView({ block: "nearest" });
  }, [message, storageError]);
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
    setMessage("");
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
      {(message || storageError) && (
        <div className="inline-feedback" ref={statusRef} role="status">
          {message || storageError}
        </div>
      )}
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
                    setMessage("");
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
                onClick={() => {
                  setMessage("");
                  setPending({ kind: "load", slot });
                }}
              >
                读取
              </Button>
            </div>
            {pending?.slot === slot && (
              <section
                className="save-confirm"
                ref={confirmRef}
                tabIndex={-1}
                aria-label={`确认${pending.kind === "load" ? "读取" : "覆盖"}${label(slot)}`}
              >
                <p>
                  {pending.kind === "load"
                    ? `读取“${label(slot)}”会替换当前自动进度。请确认已保存需要保留的故事。`
                    : `“${label(slot)}”已有故事。是否用当前进度覆盖？`}
                </p>
                <Button onClick={() => setPending(null)}>取消</Button>
                <Button kind="ink" onClick={confirm}>
                  确认{pending.kind === "load" ? "读取" : "覆盖"}
                </Button>
              </section>
            )}
          </div>
        ))}
      </div>
      <div className="button-row">
        <Button disabled={!s.started} onClick={download}>
          <Icon name="download" size={16} />
          导出存档
        </Button>
        <Button disabled={importing} onClick={() => input.current?.click()}>
          <Icon name="upload" size={16} />
          {importing ? "正在读取…" : "导入存档"}
        </Button>
      </div>
      <input
        type="file"
        accept=".json,application/json"
        hidden
        ref={input}
        onChange={async (e) => {
          const fileInput = e.currentTarget;
          const f = fileInput.files?.[0];
          if (!f) return;
          setMessage("");
          setImporting(true);
          try {
            if (f.size > 2_000_000) {
              setMessage("文件过大，请选择有效的江湖行存档。");
              return;
            }
            const raw = await f.text();
            if (importSave(raw)) onLoaded();
          } catch {
            setMessage("无法读取这个文件，请重新选择存档文件。");
          } finally {
            fileInput.value = "";
            setImporting(false);
          }
        }}
      />
      <p className="small muted">
        导入前会备份当前故事。存档保存在本浏览器；清理浏览器数据可能移除进度，建议定期导出。
      </p>
      <Button className="full" onClick={onMenu}>
        返回主菜单
      </Button>
    </Modal>
  );
}
