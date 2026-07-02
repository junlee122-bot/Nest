"use client";

// 하단 탭바 (v5) — 실제 앱의 내비게이션 감각
// 홈 / 집수리 / 계약서 / 시세 / 전체. 인쇄 시 숨김, safe-area 대응.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import {
  Home,
  Wrench,
  ScrollText,
  BarChart3,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "홈", icon: Home },
  { href: "/repair", label: "집수리", icon: Wrench },
  { href: "/contract", label: "계약서", icon: ScrollText },
  { href: "/rent", label: "시세", icon: BarChart3 },
  { href: "/menu", label: "전체", icon: LayoutGrid },
];

// '전체' 탭이 하이라이트되는 서브 경로들
const MENU_PATHS = ["/menu", "/utility", "/grocery", "/money", "/admin"];

export default function AppTabBar() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    if (href === "/menu") return MENU_PATHS.some((p) => pathname.startsWith(p));
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="주요 메뉴"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container-app grid grid-cols-5">
        {TABS.map((t) => {
          const active = isActive(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl pb-1.5 pt-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
                active ? "text-brand-deep" : "text-muted hover:text-ink"
              }`}
            >
              {active && (
                <m.span
                  layoutId="tabbar-pill"
                  transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  className="absolute left-1/2 top-1 h-[30px] w-12 -translate-x-1/2 rounded-full bg-brand-tint"
                  aria-hidden
                />
              )}
              <Icon size={22} strokeWidth={active ? 2.6 : 2} className="relative" />
              <span
                className={`relative text-[10px] leading-tight ${active ? "font-bold" : "font-medium"}`}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
