export const officialRanks = ["江湖游侠", "捕快", "资深捕快", "总捕", "锦衣卫"];
export const salaries = [0, 8, 16, 28, 44];
export const courtCases = [
  {
    id: "silver",
    title: "漕运失银",
    rank: 2,
    realm: 3,
    target: "许衡",
    location: "dock",
    hp: 240,
    attack: 36,
    defense: 8,
    intro:
      "漕船抵杭，封存官银却少了三箱。码头伙计遭人指认，账册中的船次却对不上。陆捕头要你查清银两去向，勿凭口供定罪。",
    clues: [
      {
        id: "seal",
        location: "dock",
        name: "核对货舱封条",
        text: "封条有二次粘合的痕迹，夹层留着许氏货栈的印记。失银是在入港前被调包。",
      },
      {
        id: "ledger",
        location: "inn",
        name: "访查押运账房",
        text: "客栈账房留下收银副本，记明许衡私改船次。两份记录相合，洗清了码头伙计的嫌疑。",
      },
    ],
    silver: 240,
    reputation: 35,
    contribution: 60,
    xp: 180,
    insights: 1,
    ending:
      "官银追回，码头伙计获释。许衡连同账册、封条一并移交，漕运账目得以重整。",
  },
  {
    id: "edict",
    title: "伪诏私征",
    rank: 3,
    realm: 5,
    target: "严庆",
    location: "alley",
    hp: 380,
    attack: 50,
    defense: 13,
    intro:
      "有人持盖印文书向商户征收军饷。百姓不敢争辩，官府却没有发过此令。你以总捕身份追查文书与印模的来路。",
    clues: [
      {
        id: "mould",
        location: "smith",
        name: "查验私铸印模",
        text: "铁匠辨出印模是新铸铜件，缺少官印旧磨损；交货人留下后巷严庆的名字。",
      },
      {
        id: "register",
        location: "office",
        name: "比对发令底册",
        text: "底册中没有这道征令。文书所用年款与现任官印不同，伪造证据齐备。",
      },
    ],
    silver: 360,
    reputation: 50,
    contribution: 80,
    xp: 280,
    insights: 2,
    ending:
      "假征令被撤下，严庆与印模归案。受害商户按册领回被征银两，私征链条就此截断。",
  },
  {
    id: "letter",
    title: "江南密函",
    rank: 4,
    realm: 6,
    target: "黑帆客",
    location: "dock",
    hp: 520,
    attack: 65,
    defense: 18,
    intro:
      "锦衣卫收到一封指向走私军械的密函，发信人却失踪了。纸张和船单是仅存的线索，须先核实密函，再阻止军械离港。",
    clues: [
      {
        id: "paper",
        location: "tower",
        name: "辨认密函纸张",
        text: "烟雨楼掌柜认出密函出自订制笺纸。留底笔迹证明发信人主动求助，并非引你入局。",
      },
      {
        id: "manifest",
        location: "dock",
        name: "核查夜航船单",
        text: "粮船载重与申报数目相差数倍，夹舱登记的铁箱由黑帆客押运，军械去向已明。",
      },
    ],
    silver: 500,
    reputation: 60,
    contribution: 100,
    xp: 400,
    insights: 2,
    ending:
      "军械被截回，发信人获救。密函、船单与铁箱封识一起送入案库，江南水道暂得安宁。",
  },
] as const;
export const courtCase = (id?: string) => courtCases.find((c) => c.id === id);
