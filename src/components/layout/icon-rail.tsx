"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IconRailProps {
  onMenuClick?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FolderKanban, label: "Projects", href: "/projects" },
  { icon: Users, label: "Workers", href: "/workers" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function IconRail({ onMenuClick }: IconRailProps) {
  const pathname = usePathname();

  // Extract org from pathname for building links
  const orgMatch = pathname.match(/\/orgs\/([^/]+)/);
  const orgId = orgMatch ? orgMatch[1] : "demo";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex w-[60px] flex-col items-center border-r border-[var(--color-border)] bg-[var(--color-panel)] py-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="mb-4 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white font-bold text-lg">
          P
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col items-center gap-2">
          {navItems.map((item) => {
            const href = item.href === "/"
              ? `/orgs/${orgId}`
              : `/orgs/${orgId}${item.href}`;
            const isActive = pathname === href ||
              (item.href !== "/" && pathname.startsWith(href));

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-[var(--color-accent)] text-white"
                        : "text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text)]"
                    )}
                    aria-label={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>
    </TooltipProvider>
  );
}
