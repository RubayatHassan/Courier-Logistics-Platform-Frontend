"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  Clock3,
  LogOut,
  MapPin,
  Menu,
  Package,
  PackageOpen,
  Plus,
  Search,
  Sparkles,
  Truck,
  UserRound,
  Users,
  Wallet,
  X,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

const icons = {
  arrow: ArrowUpRight,
  arrowRight: ArrowRight,
  bell: Bell,
  box: PackageOpen,
  check: Check,
  clock: Clock3,
  close: X,
  logout: LogOut,
  menu: Menu,
  package: Package,
  pin: MapPin,
  plus: Plus,
  search: Search,
  spark: Sparkles,
  truck: Truck,
  user: UserRound,
  users: Users,
  wallet: Wallet,
} satisfies Record<string, ComponentType<LucideProps>>;

type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 19,
  className = "",
}: {
  name: IconName | string;
  size?: number;
  className?: string;
}) {
  const LucideIcon = icons[name as IconName] ?? Package;
  return <LucideIcon aria-hidden="true" className={className} size={size} strokeWidth={1.7} />;
}
