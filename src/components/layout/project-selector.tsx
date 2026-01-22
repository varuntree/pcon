"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/use-projects";
import { Id } from "../../../convex/_generated/dataModel";

interface ProjectSelectorProps {
  orgId: string;
  currentProjectId?: string;
  onNavigate?: () => void;
}

export function ProjectSelector({ orgId, currentProjectId, onNavigate }: ProjectSelectorProps) {
  const pathname = usePathname();
  const { data: projects, isLoading } = useProjects(orgId as Id<"orgs">);

  const currentProject = currentProjectId
    ? projects.find((p) => p._id === currentProjectId)
    : undefined;

  const handleNavigate = () => {
    onNavigate?.();
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
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
                !currentProjectId && pathname.includes("/projects") && "bg-gray-100"
              )}
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              All Projects
            </Link>
          </DropdownMenuItem>
          {projects.length > 0 && <Separator className="my-1" />}
          {projects.map((project) => (
            <DropdownMenuItem key={project._id} asChild>
              <Link
                href={`/orgs/${orgId}/projects/${project._id}`}
                onClick={handleNavigate}
                className={cn(
                  "cursor-pointer",
                  project._id === currentProjectId && "bg-gray-100"
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
  );
}
