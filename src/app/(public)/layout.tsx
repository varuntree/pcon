import { ConvexProvider } from "@/components/providers/convex-provider";
import { Toaster } from "@/components/ui/sonner";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProvider>
      <div className="min-h-screen bg-muted/30">
        {children}
      </div>
      <Toaster />
    </ConvexProvider>
  );
}
