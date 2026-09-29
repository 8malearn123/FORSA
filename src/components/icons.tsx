import {
  BookOpen,
  Cake,
  Calculator,
  Camera,
  CodeXml,
  CookingPot,
  Gift,
  Hand,
  Languages,
  Megaphone,
  Palette,
  PartyPopper,
  PenTool,
  Scissors,
  ShoppingBasket,
  Sprout,
  Store,
  Waves,
  Wrench,
  type LucideProps,
} from "lucide-react";

import type { CategoryIcon as CategoryIconKey } from "@/lib/taxonomy";

type IconProps = Omit<LucideProps, "ref">;

function Svg({ size = 24, strokeWidth = 1.75, children, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** دلّة القهوة — رمز الضيافة السعودية */
export function Dallah(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 2.5v1.2" />
      <path d="M10.6 6.2c0-1.5 1-2.5 2.4-2.5s2.4 1 2.4 2.5" />
      <path d="M10 6.2h6" />
      <path d="M11 6.2l.4 3.3-3 8.3a1.2 1.2 0 0 0 1.1 1.7h7a1.2 1.2 0 0 0 1.1-1.7l-3-8.3.4-3.3" />
      <path d="M9.6 13.6C7.4 12.6 5.6 10.4 3.2 6.6c2.6.8 4.5 2.3 6.9 4.7" />
      <path d="M15.4 8.6c2.6-.2 4.3 1 4.3 3.1 0 1.7-1 3-2.8 4" />
      <path d="M7.6 21h10.8" />
    </Svg>
  );
}

/** المبخرة */
export function Mabkhara(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 11.5h12l-1.6 4.5H7.6z" />
      <path d="M10 16v2.5h4V16" />
      <path d="M7.5 21h9l-1-2.5h-7z" />
      <path d="M10.2 9c-.9-1-.9-2 0-3s.9-2 0-3" />
      <path d="M13.8 9c-.9-1-.9-2 0-3s.9-2 0-3" />
    </Svg>
  );
}

export function WhatsApp(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.4 20.6l1.2-4.1a8.6 8.6 0 1 1 3.1 3z" />
      <path
        fill="currentColor"
        stroke="none"
        d="M9.2 7.4c.3 0 .6 0 .8.5l.9 2c.1.3 0 .6-.1.8l-.6.7c-.2.2-.2.5 0 .8.4.8 1 1.5 1.7 2.1.5.4 1 .7 1.6 1 .3.1.6.1.8-.1l.7-.8c.2-.3.5-.3.8-.2l1.9.9c.3.2.5.3.5.6 0 .9-.4 1.6-1.1 2-.7.4-1.6.5-2.5.2-1.9-.6-3.5-1.8-4.8-3.3-.9-1.1-1.7-2.4-1.9-3.8-.1-.9.2-1.9 1-2.6.1-.4.1-.5.3-.6z"
      />
    </Svg>
  );
}

export function Instagram(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" strokeWidth={2.5} />
    </Svg>
  );
}

const CATEGORY_ICONS: Record<CategoryIconKey, (p: IconProps) => React.ReactNode> = {
  palette: Palette,
  camera: Camera,
  code: CodeXml,
  book: BookOpen,
  wrench: Wrench,
  party: PartyPopper,
  megaphone: Megaphone,
  languages: Languages,
  hand: Hand,
  pen: PenTool,
  calculator: Calculator,
  store: Store,
  waves: Waves,
  dallah: Dallah,
  pot: CookingPot,
  cake: Cake,
  basket: ShoppingBasket,
  gift: Gift,
  mabkhara: Mabkhara,
  sprout: Sprout,
  scissors: Scissors,
};

export function CategoryIcon({ icon, ...props }: IconProps & { icon: CategoryIconKey }) {
  const Icon = CATEGORY_ICONS[icon];
  return <Icon aria-hidden="true" {...props} />;
}
