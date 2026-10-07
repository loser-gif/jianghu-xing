# 江湖行美术记录

## 当前版本：按文档原图复刻

依据 `Jianghu_RPG_Codex_Spec_Visual_Reference.docx` 及用户修正要求。排除 Figure 3–7；Figure 2 与 Figure 1 重复，使用 Figure 1 和 Figure 8–20。

全端保持最大 480px 的竖屏纸页。取消桌面侧栏展开布局，按原稿还原紧凑列表、左右双栏人物资料、山水书法页头、墨色纸边、底部五入口及暗墨描金选中态。正文为系统楷体／宋体，动态标题使用本地毛笔字体。

## 素材与映射

`public/reference/figure-N.jpg` 为文档内嵌原图。`src/components/Reference.tsx` 以 SVG viewBox 显示对应原画区域，不改画风，不生成替代人物。页内数据、列表、按钮、关系数值和交互仍由游戏状态驱动。

- Figure 1：开篇、玩家肖像、武学书册、西湖场景。
- Figure 8–10：人物谱页头、人物肖像、人物详情、羁绊图、页边和底部图标。
- Figure 11：客栈场景。
- Figure 12–16：委托、装备、装备详情、装备配置、锻造页头及物品原画。
- Figure 17–20：身份司簿、缉捕、追踪和战后判定原画。

动态页面保留可玩版本的角色与剧情数据；画面长度随内容变化，不将整页截图代替交互页面。原始综合参考尺寸有限，放大后的细节清晰度受原图限制。

`src/reference.css` 是当前复刻样式，后于基础样式加载。旧 `public/assets/` 生成素材保留历史记录，当前页面不再使用。

## 字体

`public/fonts/DocumentBrush.woff2` 是 Ma Shan Zheng 的界面字集子集，来源为 Google Fonts 官方仓库 `ofl/mashanzheng`。许可证见同目录 `OFL.txt`。字体本地加载，无外部 CDN。增加界面用字时应更新子集，否则使用楷体回退。
