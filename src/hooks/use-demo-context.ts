"use client";

import { createContext, useContext } from "react";
import { Id } from "../../convex/_generated/dataModel";

/**
 * Demo context for R1 - provides stub authentication context.
 * Will be replaced with real auth (Clerk/Auth0) in production.
 */

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: "business_owner" | "project_manager" | "worker";
  avatarUrl?: string;
}

export interface DemoContextValue {
  user: DemoUser;
  currentOrgId: Id<"orgs"> | string;
  currentProjectId: Id<"projects"> | string | null;
  setCurrentOrgId: (orgId: Id<"orgs"> | string) => void;
  setCurrentProjectId: (projectId: Id<"projects"> | string | null) => void;
  isAuthenticated: boolean;
}

// Default demo user
export const DEMO_USER: DemoUser = {
  id: "demo-user-1",
  name: "John Builder",
  email: "john@buildright.com.au",
  role: "project_manager",
  avatarUrl: undefined,
};

// Default demo context values
export const DEFAULT_DEMO_CONTEXT: DemoContextValue = {
  user: DEMO_USER,
  currentOrgId: "demo",
  currentProjectId: null,
  setCurrentOrgId: () => {},
  setCurrentProjectId: () => {},
  isAuthenticated: true,
};

// Create the context
export const DemoContext = createContext<DemoContextValue>(DEFAULT_DEMO_CONTEXT);

/**
 * Hook to access the demo context.
 * Returns the current demo user and org/project selection state.
 */
export function useDemoContext(): DemoContextValue {
  return useContext(DemoContext);
}

/**
 * Hook for checking authentication status.
 * In R1, always returns authenticated with demo user.
 */
export function useAuth() {
  const { user, isAuthenticated } = useDemoContext();

  return {
    user,
    isAuthenticated,
    isLoading: false,
  };
}

/**
 * Hook for getting the current org/project context from URL params.
 * Used by components that need to know the current scope.
 */
export function useCurrentScope(params: { orgId?: string; projectId?: string }) {
  return {
    orgId: params.orgId ?? "demo",
    projectId: params.projectId ?? null,
    hasOrg: Boolean(params.orgId),
    hasProject: Boolean(params.projectId),
  };
}
