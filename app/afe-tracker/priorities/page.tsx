"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, RefreshCw, Target, DollarSign, Building2, Users } from "lucide-react";
import { AfeUseCase, DISTRICT_MAP } from "@/lib/types";
import { EditUseCaseModal } from "@/components/afe/edit-use-case-modal";

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function getEngagementColor(level: string | null): string {
  if (!level) return "bg-gray-100 text-gray-400 border-gray-200";
  if (level.includes("Level 4")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (level.includes("Level 3")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (level.includes("Level 2")) return "bg-violet-100 text-violet-700 border-violet-200";
  if (level.includes("Level 1")) return "bg-amber-100 text-amber-700 border-amber-200";
  if (level.includes("On Hold")) return "bg-gray-100 text-gray-500 border-gray-200";
  return "bg-gray-100 text-gray-400 border-gray-200";
}

export default function PrioritiesPage() {
  const [useCases, setUseCases] = useState<AfeUseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<AfeUseCase | null>(null);

  const fetchUseCases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/afe/use-cases");
      const data = await res.json();
      if (Array.isArray(data)) {
        setUseCases(data.filter((uc: AfeUseCase) => uc.REPORTING_RANK === "1 - High"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUseCases(); }, []);

  const totalEacv = useCases.reduce((s, uc) => s + (uc.USE_CASE_EACV || 0), 0);

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white/50 backdrop-blur-sm px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Priority Use Cases
        </h1>
        <Badge className="ml-2 bg-red-100 text-red-700 border-0">1 - High</Badge>
        <div className="ml-auto flex items-center gap-2">
          {!loading && (
            <span className="text-sm text-muted-foreground">
              {useCases.length} use cases · {formatCurrency(totalEacv)} EACV
            </span>
          )}
          <Button size="sm" variant="outline" onClick={fetchUseCases} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : useCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Target className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No high-priority use cases</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Set Reporting Rank to &ldquo;1 - High&rdquo; on any use case to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {useCases.map((uc, idx) => {
              const districtInfo = uc.DISTRICT_NAME ? DISTRICT_MAP[uc.DISTRICT_NAME] : null;
              return (
                <Card key={uc.USE_CASE_ID} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <h3 className="font-semibold text-base truncate">{uc.USE_CASE_NAME}</h3>
                          <span className="text-xs text-muted-foreground font-mono">{uc.USE_CASE_NUMBER}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">{uc.ACCOUNT_NAME}</span>
                          </span>
                          {uc.USE_CASE_EACV ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              <DollarSign className="h-3.5 w-3.5" />
                              {formatCurrency(uc.USE_CASE_EACV)}
                            </span>
                          ) : null}
                          {districtInfo && (
                            <Badge className="bg-violet-100 text-violet-700 border-0 text-xs">{districtInfo.label}</Badge>
                          )}
                          {uc.USE_CASE_STAGE && (
                            <Badge variant="outline" className="text-xs">{uc.USE_CASE_STAGE}</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            AE: <span className="text-foreground ml-0.5">{uc.ACCOUNT_OWNER_NAME || "—"}</span>
                          </span>
                          <span>SE: <span className="text-foreground">{uc.USE_CASE_LEAD_SE_NAME || "—"}</span></span>
                          <span>DM: <span className="text-foreground">{districtInfo?.dm || uc.ACCOUNT_DM || "—"}</span></span>
                          {uc.PSA_AFE_SUPPORT && (
                            <Badge variant="outline" className="text-xs px-1.5">PSA: {uc.PSA_AFE_SUPPORT}</Badge>
                          )}
                          {uc.WHO_HAS_BALL && (
                            <span>Ball: <span className="text-foreground font-medium">{uc.WHO_HAS_BALL}</span></span>
                          )}
                          {uc.PRIMARY_USE_CASE && (
                            <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs">{uc.PRIMARY_USE_CASE}</Badge>
                          )}
                        </div>

                        {(uc.SE_COMMENTS || uc.NOTES) && (
                          <div className="mt-1 flex gap-3">
                            {uc.SE_COMMENTS && (
                              <div className="flex-1 bg-blue-50 border border-blue-100 rounded-md p-2">
                                <p className="text-xs font-medium text-blue-600 mb-0.5">SE Notes</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{uc.SE_COMMENTS}</p>
                              </div>
                            )}
                            {uc.NOTES && (
                              <div className="flex-1 bg-amber-50 border border-amber-100 rounded-md p-2">
                                <p className="text-xs font-medium text-amber-600 mb-0.5">AFE Notes</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{uc.NOTES}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {uc.AI_ENGAGEMENT_LEVEL && (
                          <Badge className={`text-xs px-2 py-0.5 border ${getEngagementColor(uc.AI_ENGAGEMENT_LEVEL)}`}>
                            {uc.AI_ENGAGEMENT_LEVEL}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setEditTarget(uc)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <EditUseCaseModal
        useCase={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={fetchUseCases}
      />
    </div>
  );
}
