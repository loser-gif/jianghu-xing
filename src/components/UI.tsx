import { useEffect, useRef } from "react";
import type { ReactNode, CSSProperties } from "react";
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
  index = 3,
  size = "medium",
  className = "",
}: {
  index?: number;
  size?: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label="水墨人物肖像"
      className={`portrait ${size} ${className}`}
      style={
        {
          "--px": `${(index % 3) * 50}%`,
          "--py": `${Math.floor(index / 3) * 100}%`,
        } as CSSProperties
      }
    />
  );
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
        <i
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
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select,a[href],[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", handler);
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-shade"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <header>
          <span className="eyebrow">江 湖 手 卷</span>
          <h2>{title}</h2>
          {onClose && (
            <button aria-label="关闭" className="icon-button" onClick={onClose}>
              <Icon name="close" />
            </button>
          )}
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
