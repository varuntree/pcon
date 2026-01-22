import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your organization settings"
      />

      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Settings}
            title="Settings coming soon"
            description="Organization settings and preferences will be available here"
            variant="compact"
          />
        </CardContent>
      </Card>
    </div>
  );
}
