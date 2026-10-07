import type { StoryEvent } from "../types";
export const events: StoryEvent[] = [
  {
    id: "lake_child",
    location: "lake",
    title: "柳下寻物",
    text: "一个小童蹲在柳树旁，眼圈通红。他说母亲给的铜钱掉在石缝里，天黑前若找不到，便买不成药了。",
    conditions: { notFlag: "lake_child" },
    choices: [
      {
        id: "help",
        text: "俯身帮他寻找",
        hint: "耗时一刻 · 善意会被记住",
        effects: [
          {
            morality: 3,
            flag: ["helped_child", true],
            relation: ["baizhi", 8, 5],
          },
          { item: ["herb", 2] },
        ],
        result:
          "你在石缝里找回铜钱。小童把两株药草塞给你，说白芷姐姐会记得这份情。",
      },
      {
        id: "pay",
        text: "给他十两银子",
        hint: "银两 −10 · 名望 +2",
        requirements: { item: ["silver", 10] },
        effects: [
          {
            silver: -10,
            fame: 2,
            morality: 2,
            flag: ["helped_child", true],
            relation: ["baizhi", 5, 4],
          },
        ],
        result: "小童朝你郑重一揖。湖风很轻，你心里也轻了一些。",
      },
      {
        id: "leave",
        text: "轻声劝慰，继续赶路",
        hint: "记下这次相遇",
        effects: [],
        result: "你还有自己的路要走。回头时，小童仍在柳下寻找。",
      },
    ],
  },
  {
    id: "lake_key",
    location: "lake",
    title: "湖畔旧钥",
    text: "湖水退去，一把旧铜钥匙露在石阶边。钥匙上刻着浅浅的“邵”字。",
    conditions: { notFlag: "lake_key" },
    choices: [
      {
        id: "take",
        text: "拾起钥匙，日后寻访",
        hint: "获得旧铜钥匙",
        effects: [{ item: ["key", 1] }],
        result: "钥匙带着湖水的凉意。也许后巷的旧宅能给你答案。",
      },
      {
        id: "leave",
        text: "挂在柳枝上，留给失主",
        hint: "善恶 +1",
        effects: [{ morality: 1 }],
        result: "一枚旧物，也有自己的归处。",
      },
    ],
  },
  {
    id: "old_escort",
    location: "smith",
    title: "旧日镖旗",
    text: "邵远山看见你剑柄上的旧绳结，锤子停在半空。“这结法……你是那家镖局的孩子？”炉火照亮了他眼里的往事。",
    conditions: { flag: "origin_escort", notFlag: "old_escort" },
    choices: [
      {
        id: "honest",
        text: "如实讲起自己的身世",
        hint: "邵远山好感 +12 · 信任 +15",
        effects: [
          {
            relation: ["shao", 12, 15],
            item: ["iron", 4],
            flag: ["old_friend", true],
          },
        ],
        result: "他取出珍藏的精铁放到你手里。“往后缺什么，来找邵叔。”",
      },
      {
        id: "quiet",
        text: "拱手致意，暂不多言",
        hint: "邵远山好感 +3",
        effects: [{ relation: ["shao", 3, 0] }],
        result: "邵远山点点头，没有追问。炉火仍旧温暖。",
      },
    ],
  },
  {
    id: "inn_guest",
    location: "inn",
    title: "一壶酒的分量",
    text: "一个醉客拍桌争执，苏婉娘仍耐心解释账目。你看见账上每一笔都写得清清楚楚。",
    conditions: { notFlag: "inn_guest" },
    choices: [
      {
        id: "reason",
        text: "替掌柜理清账目",
        hint: "苏婉娘好感 +10 · 信任 +10",
        effects: [
          { relation: ["suwan", 10, 10], flag: ["helped_suwan", true] },
        ],
        result:
          "醉客终于讪讪付账。苏婉娘低声道：“这份情，我记下了。以后想打听什么，尽管开口。”",
      },
      {
        id: "lie",
        text: "谎称自己认识官府，吓走醉客",
        hint: "好感 +3 · 信任 −6",
        effects: [{ relation: ["suwan", 3, -6], flag: ["lied_suwan", true] }],
        result:
          "醉客走了，苏婉娘却看穿了你的虚张声势。她道了谢，眼里多了一分审慎。",
      },
      {
        id: "watch",
        text: "静观其变",
        hint: "不介入争执",
        effects: [],
        result: "苏婉娘独自解决了这场争执，又回身招呼别的客人。",
      },
    ],
  },
  {
    id: "inn_secret",
    location: "inn",
    title: "掌柜的悄悄话",
    text: "苏婉娘趁添茶时低声说：“烟雨楼出事那晚，我见过一位绯衣女子。她走东边水路，别被西巷的脚印骗了。”",
    conditions: { flag: "helped_suwan", notFlag: "inn_secret" },
    choices: [
      {
        id: "thanks",
        text: "谢过掌柜，记下水路",
        hint: "获得可信情报 · 后续追踪可用",
        effects: [{ flag: ["trusted_clue", true], relation: ["suwan", 2, 4] }],
        result: "你把消息记在心里。曾经伸出的一次援手，如今成了一条关键线索。",
      },
      {
        id: "dismiss",
        text: "仍想亲自核实",
        hint: "保留判断",
        effects: [{ flag: ["heard_waterway", true] }],
        result: "苏婉娘笑了笑：“谨慎些好。”",
      },
    ],
  },
  {
    id: "herb_patient",
    location: "herb",
    title: "药庐急诊",
    text: "白芷扶着受伤的船工，药罐里却缺一味青灵草。她的竹篮还搁在门边。",
    conditions: { notFlag: "herb_patient" },
    choices: [
      {
        id: "herb",
        text: "取出青灵草相助",
        hint: "青灵草 −1 · 好感 +12 · 信任 +10",
        requirements: { item: ["herb", 1] },
        effects: [
          {
            item: ["herb", -1],
            relation: ["baizhi", 12, 10],
            flag: ["helped_baizhi", true],
            morality: 4,
          },
          { item: ["medicine", 2] },
        ],
        result:
          "船工渐渐平静下来。白芷送你两瓶金疮药，说往后来药庐疗伤可减半收取诊金。",
      },
      {
        id: "help",
        text: "留下来帮忙煎药",
        hint: "好感 +5 · 善恶 +2",
        effects: [{ relation: ["baizhi", 5, 3], morality: 2 }],
        result: "你守着小炉，直到药香溢满屋子。白芷向你认真道谢。",
      },
    ],
  },
  {
    id: "tower_scholar",
    location: "tower",
    title: "残页上的剑意",
    text: "临窗的书生铺开一张残谱，眉头紧锁。你辨出墨迹中藏着一套连绵的剑招。",
    conditions: { notFlag: "tower_scholar" },
    choices: [
      {
        id: "read",
        text: "循着笔意推演剑招",
        hint: "需要悟性 65 · 剑法熟练 +15",
        requirements: { minStat: ["insight", 65] },
        effects: [{ art: ["swordArt", 15], fame: 1 }],
        result: "笔锋便是剑锋。你顺着残页悟出数式，书生喜不自胜。",
      },
      {
        id: "listen",
        text: "坐下听他讲解",
        hint: "悟得《清风十三剑》基础",
        effects: [{ art: ["swordArt", 5] }],
        result: "茶凉了一盏，你终于听懂了其中最简单的一式。",
      },
    ],
  },
  {
    id: "alley_box",
    location: "alley",
    title: "旧宅木匣",
    text: "旧宅窗下有一只落满尘灰的木匣。锁眼上刻着“邵”字，似乎已多年无人开启。",
    conditions: { notFlag: "alley_box", item: ["key", 1] },
    choices: [
      {
        id: "open",
        text: "用旧钥匙打开木匣，归还遗物",
        hint: "旧铜钥匙 −1 · 邵远山信任 +12",
        effects: [
          {
            item: ["key", -1],
            relation: ["shao", 8, 12],
            flag: ["returned_box", true],
          },
          { item: ["iron", 3] },
        ],
        result:
          "里面是旧镖局的名册。你将它交还邵远山，老人沉默许久，以精铁相谢。",
      },
      {
        id: "keep",
        text: "取走匣底的银两",
        hint: "银两 +25 · 善恶 −5",
        effects: [{ silver: 25, morality: -5, flag: ["stole_box", true] }],
        result: "你拿走了银子。名册留在原处，这个选择也留在了你的记忆里。",
      },
    ],
  },
  {
    id: "dock_boatman",
    location: "dock",
    title: "渡口的老人",
    text: "老船工费力地搬着木箱，潮水正一寸寸涨上岸。你若搭把手，他便能在天黑前收工。",
    conditions: { notFlag: "dock_boatman" },
    choices: [
      {
        id: "help",
        text: "帮他把木箱搬上船",
        hint: "善恶 +2 · 获得桂花酿",
        effects: [
          { morality: 2, item: ["wine", 1], flag: ["helped_boatman", true] },
        ],
        result:
          "老人递来一壶自酿的桂花酒：“姑娘往北边仓房去了。若你在找她，莫上那条空船。”",
      },
      {
        id: "leave",
        text: "告辞赶路",
        hint: "继续自己的旅程",
        effects: [],
        result: "橹声渐远，老人独自驶入薄雾。",
      },
    ],
  },
  {
    id: "office_letter",
    location: "office",
    title: "不识字的陈情人",
    text: "一位卖菜老妇攥着状纸站在衙门外。她不识字，求你替她念一遍。",
    conditions: { notFlag: "office_letter" },
    choices: [
      {
        id: "read",
        text: "逐句读给她听",
        hint: "陆怀安信任 +5 · 名望 +2",
        effects: [{ relation: ["lu", 3, 5], fame: 2, morality: 2 }],
        result:
          "老妇听明白了，郑重道谢。陆捕头在门内看见这一幕，向你微微颔首。",
      },
      {
        id: "charge",
        text: "收取五两代读钱",
        hint: "银两 +5 · 陆怀安信任 −5",
        effects: [{ silver: 5, relation: ["lu", 0, -5], morality: -2 }],
        result: "老妇付了钱。陆捕头的目光从你身上移开。",
      },
    ],
  },
  {
    id: "lake_swordsman",
    location: "lake",
    title: "照水见心",
    text: "无名剑客看着你手中的兵刃。“你只顾着看对手，却忘了自己的呼吸。”他示意你看湖面。",
    conditions: { notFlag: "lake_swordsman" },
    choices: [
      {
        id: "learn",
        text: "静下心来，向他请教",
        hint: "学会《追云步》 · 剑客好感 +5",
        effects: [{ art: ["lightArt", 5], relation: ["swordsman", 5, 3] }],
        result: "他只走了三步，你却仿佛看见一片云从水上掠过。",
      },
      {
        id: "argue",
        text: "提剑相邀，切磋一式",
        hint: "气血 −15 · 江湖交手经历 +1",
        effects: [
          {
            hp: -15,
            flag: ["sparred_lake", true],
            relation: ["swordsman", 2, 2],
          },
        ],
        result: "你的剑刚出鞘，他已收步。这次交手，你会记很久。",
      },
    ],
  },
  {
    id: "herb_night",
    location: "herb",
    title: "夜色中的药香",
    text: "深夜，白芷仍在灯下誊写药方。她说城西的病人明早便要用药。",
    conditions: { notFlag: "herb_night", period: [4, 5] },
    choices: [
      {
        id: "stay",
        text: "留下研磨药材",
        hint: "信任 +8 · 获得金疮药",
        effects: [{ relation: ["baizhi", 5, 8], item: ["medicine", 1] }],
        result: "不必多说什么，一盏灯下，也算并肩过一程。",
      },
      {
        id: "rest",
        text: "劝她早些休息",
        hint: "好感 +2",
        effects: [{ relation: ["baizhi", 2, 0] }],
        result: "她应了一声，给自己添了一杯热水。",
      },
    ],
  },
];
