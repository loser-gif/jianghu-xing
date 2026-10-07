import { Art, Header, Portrait, ItemPicture } from "./InkUI";
import { items } from "../data/world";
import { Backpack, UsersRound, Mountain, BookOpen, Map } from "lucide-react";
export const ReferenceArt = Art;
export const ReferenceHeader = Header;
export function ReferencePortrait({
  index = 6,
  size = "medium",
  className = "",
}: {
  index?: number;
  size?: string;
  className?: string;
}) {
  return (
    <div className={`portrait ${size} ${className}`}>
      <Portrait
        id={
          ["suwan", "baizhi", "shao", "swordsman", "lu", "gu", "player"][
            index
          ] || "player"
        }
      />
    </div>
  );
}
export function ItemArt({
  icon,
  itemId,
  className = "",
}: {
  icon: string;
  itemId?: string;
  className?: string;
}) {
  const item =
    items.find((i) => i.id === itemId) ||
    items.find((i) => i.icon === icon) ||
    items[0];
  return (
    <div className={`item-art ${className}`}>
      <ItemPicture item={item} />
    </div>
  );
}
export function ReferenceNavIcon({ index }: { index: number }) {
  const C = [Backpack, UsersRound, Mountain, BookOpen, Map][index] || Map;
  return <C strokeWidth={1.6} aria-hidden="true" />;
}
export function InkEdges() {
  return null;
}
