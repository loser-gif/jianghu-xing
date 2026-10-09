export const sects = [
  {
    id: "qinglan",
    name: "青岚门",
    mark: "岚",
    location: "lake",
    place: "西湖",
    motto: "剑出青岚，心照山河",
    description: "借西湖别院授艺，重实战与身法，不限所用兵器。",
    art: "lightArt",
    supply: "iron",
    count: 2,
    specialty: "演武额外修为 +10",
  },
  {
    id: "baiyao",
    name: "百药谷",
    mark: "药",
    location: "herb",
    place: "青山药庐",
    motto: "草木有灵，济世亦修行",
    description: "在青山药庐设堂，以医药扶助江湖，内外兼修。",
    art: "innerArt",
    supply: "medicine",
    count: 2,
    specialty: "交付物资额外贡献 +6",
  },
  {
    id: "tiegui",
    name: "铁归堂",
    mark: "铸",
    location: "smith",
    place: "铁匠铺",
    motto: "百炼成器，一诺千金",
    description: "由匠人与护镖武者结成，传授拳脚与铸器之道。",
    art: "fistArt",
    supply: "ore",
    count: 4,
    specialty: "交付物资额外银两 +12",
  },
] as const;
export const sectRanks = ["外门弟子", "内门弟子", "亲传弟子", "执事"];
export const sectRankNeeds = [
  { merit: 0, realm: 0, floor: 0 },
  { merit: 30, realm: 1, floor: 1 },
  { merit: 90, realm: 2, floor: 3 },
  { merit: 180, realm: 3, floor: 5 },
];
export const sectDailyKeys = [
  "drill",
  "supply",
  "study",
  "recruit",
  "outreach",
];
export const sectExchanges = [
  { id: "medicine", name: "金疮药", count: 2, cost: 8 },
  { id: "iron", name: "精铁", count: 3, cost: 12 },
  { id: "tonic", name: "凝神散", count: 2, cost: 14 },
];
