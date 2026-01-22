"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Send,
  GraduationCap,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { useInductionInvites } from "@/hooks/use-induction-invites";
import { useActiveInductionTypes, InductionTypeData } from "@/hooks/use-induction-types";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";

export default function CreateInductionInvitePage() {
  const params = useParams();
  const _router = useRouter();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;

  const { actions } = useInductionInvites(projectId);
  const { data: inductionTypes, isLoading: typesLoading } = useActiveInductionTypes(orgId);

  // Form state
  const [inductionTypeId, setInductionTypeId] = useState<string>("");
  const [targetName, setTargetName] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state
  const [createdInvite, setCreatedInvite] = useState<{
    id: string;
    shareCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Validation
  const isValid = inductionTypeId !== "";

  const selectedType = inductionTypes.find(
    (t: InductionTypeData) => (t._id as string) === inductionTypeId
  );

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const id = await actions.create({
        orgId: orgId as Id<"orgs">,
        inductionTypeId: inductionTypeId as Id<"inductionTypes">,
        createdBy: "demo-worker" as Id<"workers">,
        targetName: targetName.trim() || undefined,
        targetEmail: targetEmail.trim() || undefined,
        expiresInDays,
      });

      // Generate a demo share code for display
      const shareCode = `${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 10)}`.toUpperCase();
      setCreatedInvite({ id: id as string, shareCode });
    } catch (err) {
      console.error("Failed to create invite:", err);
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getShareUrl = () => {
    if (!createdInvite) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/w/induct/${createdInvite.shareCode}`;
  };

  const handleCopy = async () => {
    const url = getShareUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAnother = () => {
    setCreatedInvite(null);
    setInductionTypeId("");
    setTargetName("");
    setTargetEmail("");
    setExpiresInDays(30);
  };

  // Success view after invite creation
  if (createdInvite) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invite Created"
          subtitle="Your induction invite has been created successfully"
          actions={
            <Link href={`/orgs/${orgId}/projects/${projectId}/inductions`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Inductions
              </Button>
            </Link>
          }
        />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Invite Ready to Share</CardTitle>
                <CardDescription>
                  Share this link with the worker to complete their induction
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invite details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-gray-500 text-sm">Induction Type</Label>
                <p className="font-medium">{selectedType?.name || "Unknown"}</p>
              </div>
              {targetName && (
                <div>
                  <Label className="text-gray-500 text-sm">For</Label>
                  <p className="font-medium">{targetName}</p>
                </div>
              )}
              {targetEmail && (
                <div>
                  <Label className="text-gray-500 text-sm">Email</Label>
                  <p className="font-medium">{targetEmail}</p>
                </div>
              )}
              <div>
                <Label className="text-gray-500 text-sm">Expires In</Label>
                <p className="font-medium">{expiresInDays} days</p>
              </div>
            </div>

            {/* Share link */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <Label className="text-gray-500 text-sm mb-2 block">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  value={getShareUrl()}
                  readOnly
                  className="font-mono text-sm bg-white"
                />
                <Button onClick={handleCopy} variant="outline">
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(getShareUrl(), "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>How it works:</strong> When the worker opens this link, they will
                see the induction wizard. After completing all steps and signing, their
                completion will appear in the &quot;Awaiting Review&quot; tab for your approval.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleCreateAnother} variant="outline">
                Create Another Invite
              </Button>
              <Link href={`/orgs/${orgId}/projects/${projectId}/inductions`}>
                <Button>
                  Done
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Creation form
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Induction Invite"
        subtitle="Generate a share link for off-site induction completion"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/inductions`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inductions
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invite Details</CardTitle>
          <CardDescription>
            Select an induction type and optionally specify who this invite is for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Induction Type *</Label>
            {typesLoading ? (
              <div className="p-4 text-center text-gray-500">Loading induction types...</div>
            ) : inductionTypes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No active induction types available.{" "}
                <Link
                  href={`/orgs/${orgId}/induction-types`}
                  className="text-[var(--color-accent)] hover:underline"
                >
                  Create one first
                </Link>
              </div>
            ) : (
              <Select value={inductionTypeId} onValueChange={setInductionTypeId}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Select induction type..." />
                </SelectTrigger>
                <SelectContent>
                  {inductionTypes.map((type: InductionTypeData) => (
                    <SelectItem key={type._id as string} value={type._id as string}>
                      <div className="flex flex-col">
                        <span>{type.name}</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {type.scope} • {type.steps?.length || 0} steps
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="targetName">Worker Name (optional)</Label>
              <Input
                id="targetName"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="John Smith"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pre-fill the name for the worker
              </p>
            </div>
            <div>
              <Label htmlFor="targetEmail">Worker Email (optional)</Label>
              <Input
                id="targetEmail"
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="john@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pre-fill the email for the worker
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="expiresInDays">Link Expires In</Label>
            <Select
              value={String(expiresInDays)}
              onValueChange={(v) => setExpiresInDays(parseInt(v))}
            >
              <SelectTrigger className="max-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              The link will expire after this period
            </p>
          </div>

          {selectedType && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3 mb-3">
                <GraduationCap className="h-5 w-5 text-[var(--color-accent)]" />
                <span className="font-medium">{selectedType.name}</span>
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded capitalize">
                  {selectedType.scope}
                </span>
              </div>
              {selectedType.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {selectedType.description}
                </p>
              )}
              <div className="text-sm text-gray-500">
                {selectedType.steps?.length || 0} content steps
                {selectedType.validityDays && (
                  <> • Valid for {selectedType.validityDays} days after completion</>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Invite
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
