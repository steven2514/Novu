import * as Lucide from 'lucide-react';

const ICON_MAP = {
  'credit-card': Lucide.CreditCard,
  tv: Lucide.Tv,
  music: Lucide.Music,
  cloud: Lucide.Cloud,
  'gamepad-2': Lucide.Gamepad2,
  'smartphone': Lucide.Smartphone,
  laptop: Lucide.Laptop,
  clapperboard: Lucide.Clapperboard,
  monitor: Lucide.Monitor,
  dumbbell: Lucide.Dumbbell,
  target: Lucide.Target,
  plane: Lucide.Plane,
  home: Lucide.Home,
  car: Lucide.Car,
  calculator: Lucide.Calculator,
  'graduation-cap': Lucide.GraduationCap,
  wallet: Lucide.Wallet,
  gift: Lucide.Gift,
  ribbon: Lucide.Ribbon,
  puzzle: Lucide.Puzzle,
  landmark: Lucide.Landmark,
  'refresh-cw': Lucide.RefreshCw,
  calendar: Lucide.Calendar,
  'calendar-days': Lucide.CalendarDays,
  'book-open': Lucide.BookOpen,
  'trash-2': Lucide.Trash2,
  check: Lucide.Check,
  x: Lucide.X,
  'trending-up': Lucide.TrendingUp,
  'trending-down': Lucide.TrendingDown,
  bell: Lucide.Bell,
  circle: Lucide.Circle,
  menu: Lucide.Menu,
  'chart-no-axes-column-increasing': Lucide.ChartNoAxesColumnIncreasing,
  'arrow-left-right': Lucide.ArrowLeftRight,
  'layout-dashboard': Lucide.LayoutDashboard,
  'wave': Lucide.Wave,
  pizza: Lucide.Pizza,
  eye: Lucide.Eye,
  'eye-off': Lucide.EyeOff,
  shield: Lucide.Shield,
  'arrow-right': Lucide.ArrowRight,
  'log-out': Lucide.LogOut,
};

export function Icon({ name, size = 18, className = '', style }) {
  const Component = ICON_MAP[name];
  if (!Component) return <span>{name}</span>;
  return <Component size={size} className={className} style={style} />;
}

export const ICONOS_SUSCRIPCION = ['credit-card', 'tv', 'music', 'cloud', 'gamepad-2', 'smartphone', 'laptop', 'clapperboard', 'monitor', 'dumbbell'];

export const ICONOS_META = ['target', 'plane', 'home', 'car', 'calculator', 'laptop', 'graduation-cap', 'wallet', 'gift', 'ribbon'];
