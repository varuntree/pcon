import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Shield, AlertTriangle, GraduationCap, Award } from "lucide-react";

export default async function SafetyOverviewPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  const safetyModules = [
    {
      title: "SWMS Templates",
      description: "Manage Safe Work Method Statement templates for your organization",
      href: `/orgs/${orgId}/swms-templates`,
      icon: FileText,
      stats: { label: "Templates", value: "—" },
    },
    {
      title: "Permit Types",
      description: "Configure permit types and approval workflows",
      href: `/orgs/${orgId}/permit-types`,
      icon: Shield,
      stats: { label: "Types", value: "—" },
    },
    {
      title: "Incident Templates",
      description: "Set up incident reporting templates and investigation workflows",
      href: `/orgs/${orgId}/incident-templates`,
      icon: AlertTriangle,
      stats: { label: "Templates", value: "—" },
    },
    {
      title: "Induction Types",
      description: "Create induction programs for workers and contractors",
      href: `/orgs/${orgId}/induction-types`,
      icon: GraduationCap,
      stats: { label: "Types", value: "—" },
    },
    {
      title: "Certifications",
      description: "Manage certification types and track worker competencies",
      href: `/orgs/${orgId}/certifications`,
      icon: Award,
      stats: { label: "Types", value: "—" },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety Management"
        subtitle="Configure organization-wide safety templates and requirements"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {safetyModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="h-full transition-colors hover:border-[var(--color-accent)]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
                    <module.icon className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{module.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {module.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
