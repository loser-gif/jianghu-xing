import { PlayerPortrait } from "./PlayerPortrait";
import { useDialog } from "./useDialog";
import { ReferenceHeader, ReferencePortrait } from "./Reference";
import type { ReactNode } from "react";
import {
  Mountain,
  Compass,
  UserRound,
  UsersRound,
  BookOpen,
  Backpack,
  Map,
  ScrollText,
  Shield,
  Swords,
  Sword,
  Heart,
  Wind,
  Coins,
  ChevronRight,
  ArrowLeft,
  X,
  Settings2,
  Save,
  Search,
  Leaf,
  Hammer,
  Footprints,
  Ship,
  Building2,
  Hand,
  Shirt,
  FlaskConical,
  Wine,
  Coffee,
  Gem,
  KeyRound,
  Circle,
  Lasso,
  Check,
  Clock3,
  Feather,
  CircleHelp,
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  MoreHorizontal,
  Flag,
  Sparkles,
} from "lucide-react";
const icons = {
  mountain: Mountain,
  compass: Compass,
  user: UserRound,
  users: UsersRound,
  book: BookOpen,
  bag: Backpack,
  map: Map,
  scroll: ScrollText,
  shield: Shield,
  swords: Swords,
  sword: Sword,
  heart: Heart,
  wind: Wind,
  coins: Coins,
  right: ChevronRight,
  back: ArrowLeft,
  close: X,
  settings: Settings2,
  save: Save,
  search: Search,
  leaf: Leaf,
  hammer: Hammer,
  footprints: Footprints,
  boat: Ship,
  building: Building2,
  hand: Hand,
  shirt: Shirt,
  flask: FlaskConical,
  wine: Wine,
  tea: Coffee,
  gem: Gem,
  key: KeyRound,
  circle: Circle,
  lasso: Lasso,
  check: Check,
  clock: Clock3,
  feather: Feather,
  help: CircleHelp,
  download: Download,
  upload: Upload,
  reset: RotateCcw,
  sun: Sun,
  moon: Moon,
  more: MoreHorizontal,
  flag: Flag,
  spark: Sparkles,
};
export function Icon({
  name,
  size = 20,
  ...props
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const C = icons[name as keyof typeof icons] || ScrollText;
  return <C size={size} strokeWidth={1.45} aria-hidden="true" {...props} />;
}
export function Portrait({
  gender = "male",
  index = 6,
  size = "medium",
  className = "",
}: {
  gender?: "male" | "female";
  index?: number;
  size?: string;
  className?: string;
}) {
  if (index === 6)
    return (
      <div className={`portrait ${size} ${className}`}>
        <PlayerPortrait gender={gender} full={size === "hero"} />
      </div>
    );
  return <ReferencePortrait index={index} size={size} className={className} />;
}
export function Seal({ children }: { children: ReactNode }) {
  return <span className="seal">{children}</span>;
}
export function Button({
  children,
  onClick,
  disabled = false,
  kind = "default",
  className = "",
  title,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  kind?: string;
  className?: string;
  title?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      title={title}
      className={`button ${kind} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function Section({
  title,
  aside,
  children,
  className = "",
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`section ${className}`}>
      <div className="section-title">
        <h2>
          <span className="diamond" />
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
export function Meter({
  label,
  value,
  max,
  color = "green",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  return (
    <div className={`meter ${color}`}>
      <div>
        <span>{label}</span>
        <span>
          {value}
          <small> / {max}</small>
        </span>
      </div>
      <div className="meter-track">
        <span
          style={{
            width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}
export function ActionRow({
  icon,
  title,
  description,
  onClick,
  disabled = false,
  badge,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <button className="action-row" onClick={onClick} disabled={disabled}>
      <span className="action-icon">
        <Icon name={icon} />
      </span>
      <span className="action-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      {badge && <span className="tag">{badge}</span>}
      <Icon name="right" size={16} />
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  wide?: boolean;
}) {
  const { ref, closing, dismiss } = useDialog(onClose);
  return (
    <dialog
      className={`game-dialog ${wide ? "wide" : ""} ${closing ? "dialog-closing" : ""}`}
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="dialog-content">
        <div className="dialog-top">
          <h2>{title}</h2>
          {onClose && (
            <button className="icon-button" aria-label="关闭" onClick={dismiss}>
              <Icon name="close" />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </dialog>
  );
}
