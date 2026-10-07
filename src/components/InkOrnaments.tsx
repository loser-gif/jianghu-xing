import { Art } from "./InkUI";

/** Scalable silhouettes following the five motifs in the approved reference. */
export function InkNavIcon({ name }: { name: string }) {
  return (
    <svg className="ink-nav-icon" viewBox="0 0 40 40" aria-hidden="true">
      {name === "bag" ? (
        <>
          <path d="M14 6c-3-5 4-6 6 0 2-6 9-5 6 0l-4 5h-4zM14 13h12c1 6 9 9 9 17 0 7-8 8-15 8S5 37 5 30c0-8 8-11 9-17z" />
          <path
            className="icon-cut"
            d="M14 11h12M15 18c-5 6-7 11-4 15M23 16c6 5 7 11 6 15"
          />
        </>
      ) : name === "users" ? (
        <>
          <path d="M17 4c-1-4 7-4 6 0l-1 2c7 2 7 15 1 18l1 3c8 1 13 5 13 12H3c0-7 5-11 13-12l1-3c-6-3-6-16 1-18z" />
          <path className="icon-cut" d="m14 28 6 6 6-6M20 34v5" />
        </>
      ) : name === "mountain" ? (
        <>
          <path d="M2 5c11 4 25 4 36 0l-1 6H3zM5 16h30v4H5zM9 10h5v28H9zM26 10h5v28h-5zM18 11h4v6h-4zM7 36h9v3H7zM24 36h9v3h-9z" />
          <path className="icon-cut" d="M6 9h28" />
        </>
      ) : name === "book" ? (
        <>
          <path d="M16 4h8l3 3 8 3 3 22-9 3-2-12 1 15H12l1-15-2 12-9-3 3-22 8-3z" />
          <path
            className="icon-cut"
            d="m16 5 4 8 4-8M20 13v22M12 10 8 29M28 10l4 19M14 35h12"
          />
        </>
      ) : (
        <>
          <path d="m4 7 10-4 12 5 10-4v29l-10 4-12-5-10 4z" />
          <path
            className="icon-cut"
            d="M14 4v27M26 9v27M8 23l4-6 6 3 5-7 8 8M8 28l4-1M29 28l3 1"
          />
        </>
      )}
    </svg>
  );
}

export function PaperEnding() {
  return (
    <div className="paper-ending">
      <Art figure={8} rect={[0, 1340, 190, 64]} className="ending-foliage" />
      <span />
      江湖路远 · 自有来处
      <span />
      <i className="ending-seal" aria-hidden="true">
        江湖
      </i>
    </div>
  );
}

export function NavCorners() {
  return (
    <div className="nav-corners" aria-hidden="true">
      <Art figure={8} rect={[0, 1394, 62, 116]} className="nav-corner-left" />
      <Art
        figure={8}
        rect={[801, 1392, 49, 118]}
        className="nav-corner-right"
      />
    </div>
  );
}
