# 江湖行美术记录

## 参考依据

用户于 2026-10-07 明确排除参考图 Figure 3–7：深色雨夜主菜单、角色创建、江湖界面、人物面板、武学页面。采用 Figure 1–2 风格板和 Figure 8–20 的宣纸、水墨、山水、浅色人物谱视觉语言。

米白底、墨色正文、暗金选中态、朱砂印章、宋体正文、楷体标题、细边框、低饱和画作。窄屏底部五入口；桌面使用左侧导航与右侧手记栏。场景有独立插画，界面控件与文字均为真实 HTML。

## 交付素材

全部使用内置 `image_gen` 工具生成，未使用 CLI 或外部图片 API。PNG 原稿存于 `design/originals/`，经 WebP 编码后供页面使用：

- `public/assets/west-lake.webp`：开篇背景、页面山水与地图。
- `public/assets/portraits.webp`：3 列 × 2 行人物图集。依次为苏婉娘、白芷、邵远山、无名剑客、陆怀安、顾红绫。玩家暂用剑客形象。
- `public/assets/scenes.webp`：2 列 × 4 行地点图集。依次为西湖、悦来客栈、烟雨楼、后巷、旧码头、官府、铁匠铺、青山药庐。

## 生成提示词

### 西湖

Use case: historical-scene. Asset type: panoramic background illustration for an elegant Chinese wuxia text RPG. Create a wide landscape Chinese Song dynasty ink wash painting on warm ivory xuan paper #F0E9DC. Hangzhou West Lake, misty layered mountains, distant Leifeng pagoda to the right, graceful willow branches and ink rocks on the left, a tiny traditional rowing boat on still lake, stone arched bridge and lakeside pavilions on right middle distance. Refined hand painted semi-realistic traditional Chinese shanshui, dry brush textures and very muted sage green and warm sepia wash, ink charcoal fine lines. Airy, tranquil, large untouched paper negative space in sky and lake, soft organic fading edges into ivory paper. Landscape aspect ratio 3:2. No text, no letters, no seals, no UI, no borders, no photorealistic rendering, no bright colors, no dark rainy tavern.

### 人物图集

Use case: stylized-concept. Asset type: character portrait sprite atlas for Chinese wuxia text RPG, one single image in a precise 3 column by 2 row equal-size grid, six head and shoulders portraits separated by empty ivory gutters. All backgrounds flat warm xuan paper ivory #F0E9DC. Traditional Chinese ink wash with refined semi-realistic faces, delicate charcoal brush work, subtle watercolor, elegant low saturation Song dynasty aesthetic, authentic naturally distinctive adult faces, no anime, no 3D, no glamour photography, no text, no labels, no frames. Each portrait head centered in its own equal rectangular cell, shoulders at bottom, enough margin to crop circular avatars. Top left: kind 32-year-old female innkeeper in ivory robes, loosely pinned black hair with simple hairpin. Top middle: calm 24-year-old female herbalist, pale sage robes, black hair in long braid, holding a leaf. Top right: weathered 48-year-old male martial artist in gray robes with tied-up hair and short beard. Bottom left: handsome serious 28-year-old wandering swordsman in charcoal robes, high ponytail, sheathed sword across back. Bottom middle: stern 40-year-old male constable in muted dark blue ancient official uniform and cloth cap, neat moustache. Bottom right: clever defiant 25-year-old female thief in muted dusty red clothes, ponytail, lively sharp eyes. Landscape 3:2 composition, exactly six portraits in even 3x2 cells. Keep ink drawing style and paper background cohesive across all six.

### 地点图集

Use case: historical-scene. Asset type: single square atlas of EIGHT scene illustrations for a refined Chinese wuxia RPG. Exactly TWO columns by FOUR rows in a clean grid, each cell a panoramic 2:1 scene, edge to edge without text, borders or labels. Cohesive traditional Song dynasty ink wash painting on warm ivory xuan paper #F0E9DC, charcoal fine lines, delicate dry brush work, very muted sage and sepia watercolor, tranquil daylight, atmospheric mist, organic faded brush edges, no photo realism, no dark cinematic UI. Row1 left: Hangzhou West Lake with willow and small rowing boat distant pagoda. Row1 right: welcoming ancient inn courtyard with tiled roofs and tea tables, a small modest pale ochre lantern. Row2 left: elegant two-story lakeside pavilion tavern seen from water, wooden railings and a flowering tree. Row2 right: narrow ancient Chinese alley with white walls, tiled eaves, stone pavement and bamboo baskets. Row3 left: old wooden river dock with warehouses, moored small black-canopy boats and ropes. Row3 right: traditional Chinese magistrate government office courtyard with two stone lions and wooden doors. Row4 left: ancient blacksmith workshop, charcoal forge, anvil, hanging swords, warm ember muted amber. Row4 right: peaceful herbalist cottage at mountain foot, drying herbs, bamboo shelves, garden and a pine tree. No visible text, no characters or labels. Each of eight scenes must be visibly different, detailed, painterly, refined, generous pale space, perfect equal 2x4 grid. Square image.
