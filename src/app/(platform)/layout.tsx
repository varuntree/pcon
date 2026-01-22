import { ConvexProvider } from "@/components/providers/convex-provider";
import { Toaster } from "@/components/ui/sonner";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProvider>
      {children}
      <Toaster />
    </ConvexProvider>
  );
}
