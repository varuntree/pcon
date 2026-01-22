"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { OrgSelector } from "./org-selector";
import { ProjectSelector } from "./project-selector";

interface SidebarProps {
  orgId: string;
  projectId?: string;
  onNavigate?: () => void;
}

export function Sidebar({ orgId, projectId, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const handleNavigate = () => {
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Org Selector */}
      <OrgSelector currentOrgId={orgId} onNavigate={handleNavigate} />

      <Separator />

      {/* Project Selector */}
      <ProjectSelector orgId={orgId} currentProjectId={projectId} onNavigate={handleNavigate} />

      <Separator />

      {/* Navigation Links */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          <SidebarLink
            href={`/orgs/${orgId}`}
            label="Dashboard"
            active={pathname === `/orgs/${orgId}`}
            onClick={handleNavigate}
          />
          <SidebarLink
            href={`/orgs/${orgId}/projects`}
            label="Projects"
            active={pathname.startsWith(`/orgs/${orgId}/projects`)}
            onClick={handleNavigate}
          />
          <SidebarLink
            href={`/orgs/${orgId}/workers`}
            label="Workers"
            active={pathname.startsWith(`/orgs/${orgId}/workers`)}
            onClick={handleNavigate}
          />
          <SidebarLink
            href={`/orgs/${orgId}/settings`}
            label="Settings"
            active={pathname.startsWith(`/orgs/${orgId}/settings`)}
            onClick={handleNavigate}
          />
        </div>
      </ScrollArea>

      {/* Chief AI Placeholder */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            Chief AI coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  href: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarLink({ href, label, active, onClick }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "block rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-[var(--color-accent)] text-white"
          : "text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text)]"
      )}
    >
      {label}
    </Link>
  );
}
