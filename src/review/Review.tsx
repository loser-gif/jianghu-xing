import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Backpack,
  BookOpen,
  Check,
  ChevronRight,
  Coins,
  Feather,
  Footprints,
  FlaskConical,
  Gem,
  Hand,
  Heart,
  KeyRound,
  Lasso,
  Leaf,
  Map,
  MapPin,
  MessageCircle,
  Mountain,
  Search,
  Shield,
  Shirt,
  SlidersHorizontal,
  ScrollText,
  Sword,
  UsersRound,
  Wine,
  Wind,
  Coffee,
  X,
} from "lucide-react";
import { items, locations, npcs } from "../data/world";
import {
  createCharacter,
  derived,
  relationLabel,
  transition,
} from "../engine/game";
import type { Action } from "../engine/game";
import { currentNpcLocation } from "../engine/people";
import type { GameState, Item, NPC } from "../types";

import {
  InkNavIcon,
  PaperEnding,
  NavCorners,
} from "../components/InkOrnaments";
import { Header, People, Detail, Equipment } from "../components/InkUI";
function demoState() {
  const s = createCharacter("沈辞", "escort", ["careful", "sword"], "剑");
  s.location = "inn";
  s.time = 1;
  s.player.silver = 180;
  s.inventory = { ...s.inventory, sword: 1, saber: 1, boots: 1, wine: 3 };
  s.equipped = { weapon: "sword", armor: "robe", feet: "boots" };
  s.relationships.suwan = {
    favor: 60,
    trust: 42,
    met: true,
    memories: ["初到杭州时，在悦来客栈喝过一盏热茶。"],
  };
  s.relationships.baizhi = { favor: 38, trust: 35, met: true, memories: [] };
  s.relationships.lu = { favor: 12, trust: 8, met: true, memories: [] };
  s.lastMessage = "";
  return s;
}

export function Review() {
  const [s, setState] = useState(demoState),
    [page, setPage] = useState<"people" | "detail" | "equipment">("people"),
    [npc, setNpc] = useState(npcs[0]),
    [compare, setCompare] = useState(false);
  const [message, setMessage] = useState("");
  const heading = useRef<HTMLDivElement>(null);
  const act = (a: Action) => {
    const next = transition(s, a);
    setState(next);
    setMessage(next.lastMessage);
  };
  const navigate = (p: typeof page) => {
    setPage(p);
    setMessage("");
  };
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
  }, [page, npc]);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 6000);
    return () => window.clearTimeout(timer);
  }, [message]);
  return (
    <>
      <aside className="review-bar">
        <div>
          <strong>界面重制预览</strong>
          <span>演示进度 · 不写入正式存档</span>
        </div>
        <div className="review-actions">
          <button
            aria-pressed={page === "people"}
            onClick={() => navigate("people")}
          >
            人物谱
          </button>
          <button
            aria-pressed={page === "detail"}
            onClick={() => {
              setNpc(npcs[0]);
              navigate("detail");
            }}
          >
            人物详情
          </button>
          <button
            aria-pressed={page === "equipment"}
            onClick={() => navigate("equipment")}
          >
            装备页
          </button>
          <button aria-pressed={compare} onClick={() => setCompare(!compare)}>
            {compare ? "收起原图" : "对照原图"}
          </button>
        </div>
      </aside>
      <div className={`review-layout ${compare ? "comparing" : ""}`}>
        {compare && (
          <aside className="reference-panel">
            <p>
              文档参考 · Figure{" "}
              {page === "people" ? 8 : page === "detail" ? 9 : 13}
            </p>
            <img
              src={`${import.meta.env.BASE_URL}reference/figure-${page === "people" ? 8 : page === "detail" ? 9 : 13}.jpg`}
              alt="文档原始视觉参考，仅用于对照"
            />
          </aside>
        )}
        <main className="paper" ref={heading} tabIndex={-1}>
          <Header equipment={page === "equipment"} />
          <div className="page-content">
            {page === "people" ? (
              <People
                s={s}
                select={(n) => {
                  setNpc(n);
                  navigate("detail");
                }}
              />
            ) : page === "detail" ? (
              <Detail
                key={npc.id}
                s={s}
                n={npc}
                act={act}
                back={() => navigate("people")}
              />
            ) : (
              <Equipment s={s} act={act} />
            )}
          </div>
          <PaperEnding />
          <nav className="bottom-nav" aria-label="主导航">
            <NavCorners />
            <button
              aria-current={page === "equipment" ? "page" : undefined}
              onClick={() => navigate("equipment")}
            >
              <InkNavIcon name="bag" />
              <span>行囊</span>
            </button>
            <button
              aria-current={page !== "equipment" ? "page" : undefined}
              onClick={() => navigate("people")}
            >
              <InkNavIcon name="users" />
              <span>人物</span>
            </button>
            <button disabled title="此预览仅开放人物与装备">
              <InkNavIcon name="mountain" />
              <span>江湖</span>
            </button>
            <button disabled title="此预览仅开放人物与装备">
              <InkNavIcon name="book" />
              <span>武学</span>
            </button>
            <button disabled title="此预览仅开放人物与装备">
              <InkNavIcon name="map" />
              <span>地图</span>
            </button>
          </nav>
        </main>
      </div>
      {message && (
        <div className="toast" role="status">
          <Check />
          <span>{message}</span>
          <button aria-label="关闭提示" onClick={() => setMessage("")}>
            <X />
          </button>
        </div>
      )}
    </>
  );
}
