"use client";

import { useEffect, useState, useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Target, DollarSign, LayoutGrid } from "lucide-react";
import { AfeUseCase, DISTRICT_MAP } from "@/lib/types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

const RANK_ORDER = ["1 - High", "2 - Med", "3 - Low", "4 - No Show", "5 - Evaluating"];
const RANK_COLORS: Record<string, string> = {
  "1 - High": "bg-red-100 text-red-700 border-red-200",
  "2 - Med": "bg-orange-100 text-orange-700 border-orange-200",
  "3 - Low": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "4 - No Show": "bg-gray-100 text-gray-600 border-gray-200",
  "5 - Evaluating": "bg-blue-100 text-blue-700 border-blue-200",
};

export default function HomePage() {
  const [useCases, setUseCases] = useState<AfeUseCase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/afe/use-cases");
      const data = await res.json();
      if (Array.isArray(data)) setUseCases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalEacv = useMemo(() => useCases.reduce((s, uc) => s + (uc.USE_CASE_EACV || 0), 0), [useCases]);

  const byDistrict = useMemo(() => {
    const map: Record<string, { count: number; eacv: number }> = {};
    for (const uc of useCases) {
      const key = uc.DISTRICT_NAME || "Unknown";
      if (!map[key]) map[key] = { count: 0, eacv: 0 };
      map[key].count++;
      map[key].eacv += uc.USE_CASE_EACV || 0;
    }
    return Object.entries(map).sort((a, b) => b[1].eacv - a[1].eacv);
  }, [useCases]);

  const byRank = useMemo(() => {
    const map: Record<string, number> = {};
    for (const uc of useCases) {
      const key = uc.REPORTING_RANK || "Unranked";
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [useCases]);

  const highPriority = useMemo(
    () => useCases.filter(uc => uc.REPORTING_RANK === "1 - High"),
    [useCases]
  );

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white/50 backdrop-blur-sm px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <Badge variant="secondary" className="ml-2 bg-violet-100 text-violet-700">#ai</Badge>
        <div className="ml-auto">
          <Button size="sm" variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border-0 shadow-lg shadow-violet-500/5 bg-gradient-to-br from-white to-violet-50/50 p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <LayoutGrid className="h-4 w-4" />
              Total Use Cases
            </div>
            {loading
              ? <Skeleton className="h-9 w-16" />
              : <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{useCases.length}</div>
            }
          </div>
          <div className="rounded-2xl border-0 shadow-lg shadow-emerald-500/5 bg-gradient-to-br from-white to-emerald-50/50 p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              Total EACV
            </div>
            {loading
              ? <Skeleton className="h-9 w-24" />
              : <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{formatCurrency(totalEacv)}</div>
            }
          </div>
          <div className="rounded-2xl border-0 shadow-lg shadow-red-500/5 bg-gradient-to-br from-white to-red-50/50 p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Target className="h-4 w-4" />
              High Priority
            </div>
            {loading
              ? <Skeleton className="h-9 w-12" />
              : <div className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">{highPriority.length}</div>
            }
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              <h2 className="font-semibold text-sm">By District</h2>
            </div>
            {loading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : byDistrict.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data</p>
            ) : (
              <div className="space-y-2">
                {byDistrict.map(([district, { count, eacv }]) => {
                  const info = DISTRICT_MAP[district];
                  return (
                    <div key={district} className="flex items-center justify-between gap-2 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge className="text-xs px-1.5 py-0 bg-violet-100 text-violet-700 border-0 shrink-0">
                          {info?.label || district}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">{info?.dm || ""}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-medium text-muted-foreground">{count} UCs</span>
                        <span className="text-xs font-semibold">{formatCurrency(eacv)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-violet-500" />
              <h2 className="font-semibold text-sm">By Reporting Rank</h2>
            </div>
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (
              <div className="space-y-2">
                {RANK_ORDER.map(rank => {
                  const count = byRank[rank] || 0;
                  const pct = useCases.length > 0 ? (count / useCases.length) * 100 : 0;
                  return (
                    <div key={rank} className="flex items-center gap-3">
                      <Badge className={`text-xs px-1.5 py-0 border w-24 justify-center shrink-0 ${RANK_COLORS[rank]}`}>
                        {rank}
                      </Badge>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-6 text-right">{count}</span>
                    </div>
                  );
                })}
                {byRank["Unranked"] ? (
                  <div className="flex items-center gap-3">
                    <Badge className="text-xs px-1.5 py-0 border w-24 justify-center shrink-0 bg-gray-100 text-gray-400 border-gray-200">
                      Unranked
                    </Badge>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full" />
                    <span className="text-xs font-medium w-6 text-right">{byRank["Unranked"]}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {!loading && highPriority.length > 0 && (
          <div className="rounded-2xl border border-red-100 bg-red-50/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-red-500" />
              <h2 className="font-semibold text-sm text-red-700">High Priority Use Cases</h2>
            </div>
            <div className="space-y-2">
              {highPriority.map(uc => (
                <div key={uc.USE_CASE_ID} className="flex items-center justify-between gap-4 bg-white rounded-xl px-4 py-2.5 border border-red-100">
                  <div className="min-w-0">
                    <span className="font-medium text-sm">{uc.ACCOUNT_NAME}</span>
                    <span className="text-xs text-muted-foreground ml-2 truncate">{uc.USE_CASE_NAME}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {uc.DISTRICT_NAME && (
                      <Badge className="text-xs px-1.5 py-0 bg-violet-100 text-violet-700 border-0">
                        {DISTRICT_MAP[uc.DISTRICT_NAME]?.label || uc.DISTRICT_NAME}
                      </Badge>
                    )}
                    <span className="text-xs font-semibold">{formatCurrency(uc.USE_CASE_EACV || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
