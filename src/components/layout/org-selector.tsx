"use client";

import Link from "next/link";
import { ChevronDown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useOrgs } from "@/hooks/use-orgs";

interface OrgSelectorProps {
  currentOrgId: string;
  onNavigate?: () => void;
}

export function OrgSelector({ currentOrgId, onNavigate }: OrgSelectorProps) {
  const { data: orgs, isLoading } = useOrgs();

  const currentOrg = orgs.find((o) => o._id === currentOrgId) ?? orgs[0];

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
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{currentOrg?.name ?? "Select Organization"}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          {orgs.map((org) => (
            <DropdownMenuItem key={org._id} asChild>
              <Link
                href={`/orgs/${org._id}`}
                onClick={handleNavigate}
                className={cn(
                  "cursor-pointer",
                  org._id === currentOrgId && "bg-gray-100"
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
  );
}
