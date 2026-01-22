"use client";

import { ConvexProvider as BaseConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, createContext, useContext, useMemo } from "react";

// Create Convex client - use real URL if configured, otherwise use placeholder
// The placeholder URL allows the ConvexReactClient to be created (required for hooks)
// but all queries should be skipped when Convex is not truly available
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const isConvexConfigured = Boolean(convexUrl);

// Context to track if Convex is actually available (not just the provider exists)
const ConvexAvailableContext = createContext<boolean>(false);

export function useConvexAvailable(): boolean {
  return useContext(ConvexAvailableContext);
}

export function ConvexProvider({ children }: { children: ReactNode }) {
  // Create client - use real URL or placeholder
  // Placeholder allows hooks to work but queries should be skipped
  const client = useMemo(() => {
    const url = convexUrl || "https://placeholder.convex.cloud";
    return new ConvexReactClient(url);
  }, []);

  return (
    <ConvexAvailableContext.Provider value={isConvexConfigured}>
      <BaseConvexProvider client={client}>{children}</BaseConvexProvider>
    </ConvexAvailableContext.Provider>
  );
}
