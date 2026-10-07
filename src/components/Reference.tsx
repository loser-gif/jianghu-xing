/** Original document artwork, clipped at render time. No generated replacements. */
export function ReferenceArt({
  figure,
  rect,
  className = "",
  label,
  fit = "xMidYMid slice",
}: {
  figure: number;
  rect: [number, number, number, number];
  className?: string;
  label?: string;
  fit?: string;
}) {
  const [x, y, w, h] = rect;
  return (
    <svg
      className={`reference-art ${className}`}
      viewBox={`${x} ${y} ${w} ${h}`}
      preserveAspectRatio={fit}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <image
        href={`${import.meta.env.BASE_URL}reference/figure-${figure}.jpg`}
        width={figure === 1 ? 1200 : 850}
        height={figure === 1 ? 1097 : 1510}
      />
    </svg>
  );
}

const headings: Record<string, number> = {
  人物谱: 8,
  羁绊图: 10,
  人物委托: 12,
  装备谱: 13,
  装备详情: 14,
  装备配置: 15,
  锻造坊: 16,
  身份司簿: 17,
  缉捕令: 18,
  追缉行程: 19,
  缉拿判定: 20,
};
export function ReferenceHeader({
  title,
  subtitle = "江湖路远，自有来处",
}: {
  title: string;
  subtitle?: string;
}) {
  const figure = headings[title];
  return (
    <header
      className={`reference-header ${figure ? "original-heading" : "live-heading"}`}
      aria-label={title}
    >
      {figure ? (
        <>
          <ReferenceArt figure={figure} rect={[0, 0, 850, 250]} />
          <h1 className="sr-only">{title}</h1>
        </>
      ) : (
        <>
          <ReferenceArt
            figure={8}
            rect={[375, 0, 475, 250]}
            className="header-landscape"
          />
          <ReferenceArt
            figure={8}
            rect={[0, 0, 74, 165]}
            className="header-bamboo"
          />
          <h1>
            {title}
            <em>江湖</em>
          </h1>
          <p>{subtitle}</p>
          <small>
            千山万水，因人而有故事。
            <br />
            江湖路远，幸与君相逢。
          </small>
        </>
      )}
    </header>
  );
}

export function ReferencePortrait({
  index = 6,
  size = "medium",
  className = "",
}: {
  index?: number;
  size?: string;
  className?: string;
}) {
  const portraits: [number, [number, number, number, number]][] = [
    [9, [88, 204, 330, 286]],
    [8, [28, 705, 202, 145]],
    [8, [28, 862, 202, 145]],
    [8, [28, 1019, 202, 144]],
    [8, [28, 1175, 202, 141]],
    [18, [34, 505, 305, 370]],
    [1, [909, 113, 146, 179]],
  ];
  const [figure, rect] = portraits[index] || portraits[6];
  return (
    <div className={`portrait ${size} ${className}`}>
      <ReferenceArt figure={figure} rect={rect} label="文档原画人物肖像" />
    </div>
  );
}

const objects: Record<string, [number, [number, number, number, number]]> = {
  sword: [15, [43, 342, 87, 86]],
  swords: [15, [43, 342, 87, 86]],
  shirt: [15, [42, 482, 87, 90]],
  footprints: [15, [42, 625, 87, 88]],
  wind: [15, [42, 625, 87, 88]],
  gem: [15, [601, 631, 91, 89]],
  book: [15, [601, 769, 91, 91]],
  wine: [15, [43, 770, 83, 91]],
  flask: [1, [1061, 767, 45, 52]],
  leaf: [1, [929, 849, 43, 43]],
  coins: [1, [1122, 848, 44, 46]],
  tea: [9, [721, 1230, 105, 118]],
  bag: [1, [1105, 1004, 86, 80]],
  hammer: [16, [494, 904, 315, 227]],
  scroll: [15, [601, 769, 91, 91]],
};
export function ItemArt({
  icon,
  className = "",
}: {
  icon: string;
  className?: string;
}) {
  const [figure, rect] = objects[icon] || objects.book;
  return (
    <ReferenceArt
      figure={figure}
      rect={rect}
      className={`item-art ${className}`}
    />
  );
}

export function ReferenceNavIcon({ index }: { index: number }) {
  const xs = [80, 244, 403, 572, 737];
  return (
    <ReferenceArt
      figure={8}
      rect={[xs[index], 1402, 38, 47]}
      className="nav-pictogram"
    />
  );
}

export function InkEdges() {
  return (
    <div className="ink-edges" aria-hidden="true">
      <ReferenceArt
        figure={8}
        rect={[0, 1325, 180, 74]}
        className="edge-left"
      />
      <ReferenceArt
        figure={8}
        rect={[0, 1455, 185, 55]}
        className="edge-bottom-left"
      />
      <ReferenceArt
        figure={8}
        rect={[754, 1397, 96, 113]}
        className="edge-right"
      />
    </div>
  );
}
