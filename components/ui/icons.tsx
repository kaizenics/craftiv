import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  ArrowUp01Icon,
  Award02Icon,
  Briefcase01Icon,
  BulbIcon,
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  DashboardSquare02Icon,
  DashedLineCircleIcon,
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  EyeIcon,
  File01Icon,
  File02Icon,
  FileUpIcon,
  FilterIcon,
  GlobeIcon,
  GridIcon,
  HeartCheckIcon,
  Image01Icon,
  LanguageSquareIcon,
  LaptopIcon,
  Layers01Icon,
  Layout01Icon,
  Layout05Icon,
  LayoutGridIcon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link02Icon,
  Loading03Icon,
  Mail01Icon,
  Medal01Icon,
  Menu01Icon,
  MoreVerticalIcon,
  PaintBrush01Icon,
  PencilIcon,
  PenTool01Icon,
  PlusSignIcon,
  Redo02Icon,
  RefreshIcon,
  RotateLeft01Icon,
  ScanIcon,
  Scroll01Icon,
  Search01Icon,
  Settings01Icon,
  Shield01Icon,
  Shield02Icon,
  SortByUp01Icon,
  SparklesIcon,
  StarIcon,
  Target01Icon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  Tick02Icon,
  Undo02Icon,
  Upload01Icon,
  UserGroupIcon,
  ValidationIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";

export type IconProps = Omit<
  React.ComponentProps<typeof HugeiconsIcon>,
  "icon" | "size" | "strokeWidth"
> & {
  size?: number | string;
  strokeWidth?: number | string;
};

export type LucideIcon = React.ComponentType<IconProps>;

function normalizeNumber(value: number | string | undefined, fallback?: number) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function createIcon(icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]): LucideIcon {
  const Icon = ({ strokeWidth = 2, size, ...props }: IconProps) => (
    <HugeiconsIcon
      icon={icon}
      strokeWidth={normalizeNumber(strokeWidth, 2)}
      size={normalizeNumber(size)}
      {...props}
    />
  );

  return Icon;
}

export const AlertCircle = createIcon(AlertCircleIcon);
export const AlertTriangle = createIcon(Alert02Icon);
export const ArrowLeft = createIcon(ArrowLeft01Icon);
export const ArrowRight = createIcon(ArrowRight01Icon);
export const ArrowUpRight = createIcon(ArrowUpRight01Icon);
export const ArrowUp = createIcon(ArrowUp01Icon);
export const Award = createIcon(Award02Icon);
export const BadgeCheck = createIcon(CheckmarkBadge01Icon);
export const Bold = createIcon(TextBoldIcon);
export const Briefcase = createIcon(Briefcase01Icon);
export const CalendarIcon = createIcon(Calendar03Icon);
export const Check = createIcon(Tick02Icon);
export const CheckCircle2 = createIcon(CheckmarkCircle02Icon);
export const ChevronDown = createIcon(ArrowDown01Icon);
export const ChevronLeft = createIcon(ArrowLeft01Icon);
export const ChevronRight = createIcon(ArrowRight01Icon);
export const ChevronUp = createIcon(ArrowUp01Icon);
export const CircleDashed = createIcon(DashedLineCircleIcon);
export const Clock = createIcon(Clock01Icon);
export const Copy = createIcon(Copy01Icon);
export const Download = createIcon(Download01Icon);
export const Edit = createIcon(Edit02Icon);
export const Eye = createIcon(EyeIcon);
export const EyeOff = createIcon(ViewOffIcon);
export const File = createIcon(File01Icon);
export const FileText = createIcon(File02Icon);
export const FileUp = createIcon(FileUpIcon);
export const Filter = createIcon(FilterIcon);
export const Globe = createIcon(GlobeIcon);
export const Grid = createIcon(GridIcon);
export const Heart = createIcon(HeartCheckIcon);
export const Image = createIcon(Image01Icon);
export const Italic = createIcon(TextItalicIcon);
export const Languages = createIcon(LanguageSquareIcon);
export const Laptop = createIcon(LaptopIcon);
export const Layers = createIcon(Layers01Icon);
export const Layout = createIcon(Layout01Icon);
export const LayoutDashboard = createIcon(DashboardSquare02Icon);
export const LayoutGrid = createIcon(LayoutGridIcon);
export const LayoutTemplate = createIcon(Layout05Icon);
export const Lightbulb = createIcon(BulbIcon);
export const Link2 = createIcon(Link02Icon);
export const List = createIcon(LeftToRightListBulletIcon);
export const ListOrdered = createIcon(LeftToRightListNumberIcon);
export const Loader2 = createIcon(Loading03Icon);
export const Mail = createIcon(Mail01Icon);
export const Menu = createIcon(Menu01Icon);
export const MoreVertical = createIcon(MoreVerticalIcon);
export const Paintbrush = createIcon(PaintBrush01Icon);
export const Pencil = createIcon(PencilIcon);
export const PenLine = createIcon(PenTool01Icon);
export const Plus = createIcon(PlusSignIcon);
export const Redo2 = createIcon(Redo02Icon);
export const RefreshCw = createIcon(RefreshIcon);
export const RotateCcw = createIcon(RotateLeft01Icon);
export const ScanSearch = createIcon(ScanIcon);
export const ScrollText = createIcon(Scroll01Icon);
export const Search = createIcon(Search01Icon);
export const Settings = createIcon(Settings01Icon);
export const Shield = createIcon(Shield01Icon);
export const ShieldCheck = createIcon(Shield02Icon);
export const SortAsc = createIcon(SortByUp01Icon);
export const Sparkles = createIcon(SparklesIcon);
export const SpellCheck = createIcon(ValidationIcon);
export const Star = createIcon(StarIcon);
export const Target = createIcon(Target01Icon);
export const Trash2 = createIcon(Delete02Icon);
export const Trophy = createIcon(Medal01Icon);
export const Underline = createIcon(TextUnderlineIcon);
export const Undo2 = createIcon(Undo02Icon);
export const Upload = createIcon(Upload01Icon);
export const Users = createIcon(UserGroupIcon);
export const X = createIcon(Cancel01Icon);
export const Alert = createIcon(Alert02Icon);
export const CircleAlert = createIcon(AlertCircleIcon);
export const CircleCheck = createIcon(CheckmarkCircle02Icon);
export const FileEdit = createIcon(Edit02Icon);
export const Pen = createIcon(PenTool01Icon);
export const ShieldAlert = createIcon(Shield02Icon);
export const BadgeInfo = createIcon(AlertCircleIcon);
export const Asterisk = createIcon(SparklesIcon);
export const MessageCircle = createIcon(Mail01Icon);
export const SlidersHorizontal = createIcon(Settings01Icon);
export const WandSparkles = createIcon(SparklesIcon);
export const CircleHelp = createIcon(AlertCircleIcon);
export const CircleX = createIcon(Cancel01Icon);
export const CheckCheck = createIcon(Tick02Icon);
export const ArrowUpDown = createIcon(SortByUp01Icon);
