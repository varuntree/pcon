"use client";

import { ConvexProvider as BaseConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Create Convex client only if URL is configured
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexProvider({ children }: { children: ReactNode }) {
  // If Convex is not configured, render children without provider
  // This allows the app to run in demo mode without a Convex deployment
  if (!convex) {
    return <>{children}</>;
  }
  return <BaseConvexProvider client={convex}>{children}</BaseConvexProvider>;
}
