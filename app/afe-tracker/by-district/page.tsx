"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, RefreshCw, ChevronDown, ChevronRight, Users, DollarSign } from "lucide-react";
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

function getRankColor(rank: string | null): string {
  switch (rank) {
    case "1 - High": return "bg-red-100 text-red-700 border-red-200";
    case "2 - Med": return "bg-orange-100 text-orange-700 border-orange-200";
    case "3 - Low": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "4 - No Show": return "bg-gray-100 text-gray-600 border-gray-200";
    case "5 - Evaluating": return "bg-blue-100 text-blue-700 border-blue-200";
    default: return "bg-gray-100 text-gray-400 border-gray-200";
  }
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

const DISTRICT_ORDER = ["LifeSciencesWest", "LifeSciencesEast", "HealthTech", "PayersProviders", "StrategicHCLS"];

export default function ByDistrictPage() {
  const [useCases, setUseCases] = useState<AfeUseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editTarget, setEditTarget] = useState<AfeUseCase | null>(null);

  const fetchUseCases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/afe/use-cases");
      const data = await res.json();
      if (Array.isArray(data)) {
        setUseCases(data);
        const initial: Record<string, boolean> = {};
        DISTRICT_ORDER.forEach((d) => { initial[d] = true; });
        setExpanded(initial);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUseCases(); }, []);

  const grouped = DISTRICT_ORDER.reduce<Record<string, AfeUseCase[]>>((acc, key) => {
    acc[key] = useCases.filter((uc) => uc.DISTRICT_NAME === key);
    return acc;
  }, {});

  const uncategorized = useCases.filter((uc) => !uc.DISTRICT_NAME || !DISTRICT_ORDER.includes(uc.DISTRICT_NAME));

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white/50 backdrop-blur-sm px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          By District Manager
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {loading ? "..." : `${useCases.length} total use cases`}
          </span>
          <Button size="sm" variant="outline" onClick={fetchUseCases} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <>
            {DISTRICT_ORDER.map((districtKey) => {
              const items = grouped[districtKey] || [];
              const info = DISTRICT_MAP[districtKey];
              const totalEacv = items.reduce((s, uc) => s + (uc.USE_CASE_EACV || 0), 0);
              const highCount = items.filter((uc) => uc.REPORTING_RANK === "1 - High").length;
              const isOpen = expanded[districtKey] !== false;

              return (
                <Card key={districtKey} className="border-0 shadow-md">
                  <CardHeader
                    className="pb-3 cursor-pointer select-none"
                    onClick={() => setExpanded((prev) => ({ ...prev, [districtKey]: !prev[districtKey] }))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <CardTitle className="text-base">{info?.label || districtKey}</CardTitle>
                        <Badge className="bg-violet-100 text-violet-700 border-0 text-xs">{items.length} use cases</Badge>
                        {highCount > 0 && (
                          <Badge className="bg-red-100 text-red-700 border-0 text-xs">{highCount} High Priority</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          DM: <span className="font-medium text-foreground ml-1">{info?.dm || "—"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground">{formatCurrency(totalEacv)}</span>
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  {isOpen && (
                    <CardContent className="pt-0">
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No #ai use cases for this district.</p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((uc) => (
                            <div
                              key={uc.USE_CASE_ID}
                              className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-white hover:bg-violet-50/30 transition-colors"
                            >
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm truncate">{uc.USE_CASE_NAME}</span>
                                  <span className="text-xs text-muted-foreground font-mono shrink-0">{uc.USE_CASE_NUMBER}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground">{uc.ACCOUNT_NAME}</span>
                                  {uc.USE_CASE_STAGE && <Badge variant="outline" className="text-xs px-1 py-0">{uc.USE_CASE_STAGE}</Badge>}
                                  {uc.USE_CASE_EACV ? <span className="text-emerald-600 font-medium">{formatCurrency(uc.USE_CASE_EACV)}</span> : null}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                  <span>AE: <span className="text-foreground">{uc.ACCOUNT_OWNER_NAME || "—"}</span></span>
                                  <span>SE: <span className="text-foreground">{uc.USE_CASE_LEAD_SE_NAME || "—"}</span></span>
                                  {uc.PSA_AFE_SUPPORT && <Badge variant="outline" className="text-xs px-1 py-0">{uc.PSA_AFE_SUPPORT}</Badge>}
                                  {uc.WHO_HAS_BALL && <span className="text-foreground">Ball: {uc.WHO_HAS_BALL}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {uc.AI_ENGAGEMENT_LEVEL && (
                                  <Badge className={`text-xs px-1.5 py-0 border ${getEngagementColor(uc.AI_ENGAGEMENT_LEVEL)}`}>
                                    {uc.AI_ENGAGEMENT_LEVEL.replace("Level ", "L")}
                                  </Badge>
                                )}
                                <Badge className={`text-xs px-1.5 py-0 border ${getRankColor(uc.REPORTING_RANK)}`}>
                                  {uc.REPORTING_RANK || "—"}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setEditTarget(uc)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {uncategorized.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-muted-foreground">Uncategorized ({uncategorized.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {uncategorized.map((uc) => (
                      <div key={uc.USE_CASE_ID} className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-white">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{uc.USE_CASE_NAME}</p>
                          <p className="text-xs text-muted-foreground">{uc.ACCOUNT_NAME} · {uc.USE_CASE_NUMBER}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditTarget(uc)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
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
