"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

interface ManageCandidate {
  USE_CASE_ID: string;
  USE_CASE_NAME: string;
  USE_CASE_NUMBER: string;
  USE_CASE_STAGE: string | null;
  USE_CASE_EACV: number | null;
  ACCOUNT_NAME: string;
  DISTRICT_NAME: string | null;
  SPECIALIST_COMMENTS: string | null;
  IS_MANAGED: boolean;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function ManageUseCasesPage() {
  const [candidates, setCandidates] = useState<ManageCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/afe/manage");
      const data = await res.json();
      if (Array.isArray(data)) setCandidates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const handleAdd = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch("/api/afe/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ use_case_id: id }),
      });
      setCandidates(prev =>
        prev.map(c => c.USE_CASE_ID === id ? { ...c, IS_MANAGED: true } : c)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/afe/manage?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setCandidates(prev =>
        prev.map(c => c.USE_CASE_ID === id ? { ...c, IS_MANAGED: false } : c)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const managed = candidates.filter(c => c.IS_MANAGED);
  const available = candidates.filter(c => !c.IS_MANAGED);

  const renderRow = (uc: ManageCandidate) => (
    <div
      key={uc.USE_CASE_ID}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
        uc.IS_MANAGED
          ? "bg-emerald-50/60 border-emerald-200"
          : "bg-white border-gray-100 hover:border-violet-200"
      }`}
    >
      <div className="flex-shrink-0">
        {uc.IS_MANAGED
          ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          : <Circle className="h-5 w-5 text-gray-300" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{uc.ACCOUNT_NAME}</span>
          <span className="text-xs text-muted-foreground font-mono">{uc.USE_CASE_NUMBER}</span>
          {uc.USE_CASE_STAGE && (
            <Badge variant="outline" className="text-xs px-1 py-0">{uc.USE_CASE_STAGE}</Badge>
          )}
          {uc.DISTRICT_NAME && (
            <Badge className="text-xs px-1 py-0 bg-violet-100 text-violet-700 border-0">{uc.DISTRICT_NAME}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{uc.USE_CASE_NAME}</p>
      </div>
      <div className="flex-shrink-0 text-sm font-medium text-right w-16">
        {formatCurrency(uc.USE_CASE_EACV)}
      </div>
      <div className="flex-shrink-0">
        {uc.IS_MANAGED ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            disabled={actionLoading === uc.USE_CASE_ID}
            onClick={() => handleRemove(uc.USE_CASE_ID)}
          >
            {actionLoading === uc.USE_CASE_ID
              ? <RefreshCw className="h-3 w-3 animate-spin" />
              : <><Trash2 className="h-3 w-3 mr-1" />Remove</>
            }
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-7 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            disabled={actionLoading === uc.USE_CASE_ID}
            onClick={() => handleAdd(uc.USE_CASE_ID)}
          >
            {actionLoading === uc.USE_CASE_ID
              ? <RefreshCw className="h-3 w-3 animate-spin" />
              : <><Plus className="h-3 w-3 mr-1" />Add</>
            }
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white/50 backdrop-blur-sm px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Manage Use Cases
        </h1>
        <Badge variant="secondary" className="ml-2 bg-violet-100 text-violet-700">#ai</Badge>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {loading ? "..." : `${managed.length} tracked · ${available.length} available`}
          </span>
          <Button size="sm" variant="outline" onClick={fetchCandidates} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : (
          <>
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h2 className="font-semibold text-sm text-emerald-700">Tracked in App ({managed.length})</h2>
                <span className="text-xs text-muted-foreground">— these use cases appear on all tracker tabs</span>
              </div>
              {managed.length === 0 ? (
                <p className="text-sm text-muted-foreground px-4 py-6 text-center border border-dashed rounded-xl">
                  No use cases tracked yet. Add from the list below.
                </p>
              ) : (
                <div className="space-y-2">{managed.map(renderRow)}</div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Circle className="h-4 w-4 text-gray-400" />
                <h2 className="font-semibold text-sm text-gray-600">Available to Add ({available.length})</h2>
                <span className="text-xs text-muted-foreground">— Salesforce use cases tagged <span className="font-mono">#ai</span> not yet in app</span>
              </div>
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground px-4 py-6 text-center border border-dashed rounded-xl">
                  All #ai use cases are already tracked.
                </p>
              ) : (
                <div className="space-y-2">{available.map(renderRow)}</div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
