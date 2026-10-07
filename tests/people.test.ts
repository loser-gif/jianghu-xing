import { describe, expect, it } from "vitest";
import { createCharacter, transition } from "../src/engine/game";
import { currentNpcLocation, npcService } from "../src/engine/people";
import { npcs, shopStock, items } from "../src/data/world";
const start = () =>
  createCharacter("沈辞", "escort", ["careful", "sword"], "剑");
const npc = (id: string) => npcs.find((n) => n.id === id)!;

describe("人物行踪与服务", () => {
  it("归案后寻访目的地为官府，押送途中跟随玩家", () => {
    const s = start();
    s.quest.stage = "completed";
    expect(currentNpcLocation(npc("gu"), s)).toBe("office");
    s.quest.stage = "captured";
    s.location = "alley";
    expect(currentNpcLocation(npc("gu"), s)).toBe("alley");
    expect(npcService(npc("gu"), s)).toMatchObject({ page: "quest" });
    expect(npcService(npc("gu"), s).location).toBeUndefined();
  });
  it("客栈歇脚与夜间掌柜寻访各自指向对应地点", () => {
    const s = start();
    s.time = 5;
    expect(currentNpcLocation(npc("suwan"), s)).toBe("alley");
    expect(npcService(npc("suwan"), s)).toMatchObject({
      page: "jianghu",
      location: "inn",
    });
  });
  it("疗伤与锻造入口抵达能办理服务的地点", () => {
    const s = start();
    expect(npcService(npc("baizhi"), s)).toMatchObject({
      label: "药庐疗伤",
      location: "herb",
      page: "jianghu",
    });
    expect(npcService(npc("shao"), s)).toMatchObject({
      location: "smith",
      page: "inventory",
    });
  });
  it("深夜请教剑客指向客栈，白天指向西湖", () => {
    const s = start();
    s.time = 5;
    expect(npcService(npc("swordsman"), s).location).toBe("inn");
    s.time = 1;
    expect(npcService(npc("swordsman"), s).location).toBe("lake");
  });
});

describe("商铺展示与购买一致", () => {
  it("铁匠铺包括拳套、折扇与布衣，所有陈列品均能购买", () => {
    let s = start();
    s.location = "smith";
    s.time = 1;
    s.player.silver = 10000;
    expect(shopStock("smith")).toEqual(
      expect.arrayContaining(["glove", "fan", "robe"]),
    );
    for (const id of shopStock("smith")) {
      const before = s.inventory[id] || 0;
      const silver = s.player.silver;
      const price = items.find((i) => i.id === id)!.price;
      s = transition(s, { type: "buy", id });
      expect(s.inventory[id]).toBe(before + 1);
      expect(s.player.silver).toBe(silver - price);
    }
  });
  it("深夜铁匠铺不扣款，不发放物品", () => {
    const s = start();
    s.location = "smith";
    s.time = 5;
    const next = transition(s, { type: "buy", id: "robe" });
    expect(next.player.silver).toBe(s.player.silver);
    expect(next.inventory).toEqual(s.inventory);
    expect(next.lastMessage).toContain("打烊");
  });
  it("没有店铺的地点不能凭空购买装备", () => {
    const s = start();
    s.location = "lake";
    expect(shopStock(s.location)).toEqual([]);
    const next = transition(s, { type: "buy", id: "fan" });
    expect(next.inventory).toEqual(s.inventory);
    expect(next.player.silver).toBe(s.player.silver);
  });
});
