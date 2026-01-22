"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Building2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SidebarProps {
  orgId: string;
  projectId?: string;
  onNavigate?: () => void;
}

// Demo data - will be replaced with real data from Convex
const demoOrgs = [
  { id: "demo", name: "BuildRight Construction" },
  { id: "org2", name: "Metro Developments" },
];

const demoProjects = [
  { id: "proj1", name: "Riverside Apartments", code: "RSA-001", status: "active" },
  { id: "proj2", name: "Harbor Office Tower", code: "HOT-002", status: "planning" },
];

export function Sidebar({ orgId, projectId, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const currentOrg = demoOrgs.find((o) => o.id === orgId) ?? demoOrgs[0];
  const currentProject = projectId
    ? demoProjects.find((p) => p.id === projectId)
    : undefined;

  const handleNavigate = () => {
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Org Selector */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
            >
              <span className="flex items-center gap-2 truncate">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{currentOrg.name}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            {demoOrgs.map((org) => (
              <DropdownMenuItem key={org.id} asChild>
                <Link
                  href={`/orgs/${org.id}`}
                  onClick={handleNavigate}
                  className={cn(
                    "cursor-pointer",
                    org.id === orgId && "bg-gray-100"
                  )}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  {org.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {/* Project Selector */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
            >
              <span className="flex items-center gap-2 truncate">
                <FolderKanban className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {currentProject?.name ?? "All Projects"}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem asChild>
              <Link
                href={`/orgs/${orgId}/projects`}
                onClick={handleNavigate}
                className={cn(
                  "cursor-pointer",
                  !projectId && pathname.includes("/projects") && "bg-gray-100"
                )}
              >
                <FolderKanban className="mr-2 h-4 w-4" />
                All Projects
              </Link>
            </DropdownMenuItem>
            <Separator className="my-1" />
            {demoProjects.map((project) => (
              <DropdownMenuItem key={project.id} asChild>
                <Link
                  href={`/orgs/${orgId}/projects/${project.id}`}
                  onClick={handleNavigate}
                  className={cn(
                    "cursor-pointer",
                    project.id === projectId && "bg-gray-100"
                  )}
                >
                  <span className="flex flex-col">
                    <span>{project.name}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {project.code}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
