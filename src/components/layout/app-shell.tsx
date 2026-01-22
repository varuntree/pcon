"use client";

import { useState } from "react";
import { IconRail } from "./icon-rail";
import { Sidebar } from "./sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  orgId: string;
  projectId?: string;
}

export function AppShell({ children, orgId, projectId }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[var(--color-viewport)]">
      {/* Icon Rail - Always visible */}
      <IconRail onMenuClick={() => setSidebarOpen(true)} />

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)]">
        <Sidebar orgId={orgId} projectId={projectId} />
      </aside>

      {/* Mobile Sidebar - Sheet overlay */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar orgId={orgId} projectId={projectId} onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 flex flex-col overflow-hidden",
          "bg-[var(--color-viewport)]"
        )}
      >
        <div className="flex-1 overflow-auto">
          <div className="h-full p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
