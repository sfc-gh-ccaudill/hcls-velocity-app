"use client";

import { useEffect, useState, useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Search, RefreshCw, Download } from "lucide-react";
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

const ALL = "__all__";

export default function AfeTrackerPage() {
  const [useCases, setUseCases] = useState<AfeUseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState(ALL);
  const [rankFilter, setRankFilter] = useState(ALL);
  const [editTarget, setEditTarget] = useState<AfeUseCase | null>(null);

  const downloadBackup = async () => {
    const res = await fetch("/api/afe/backup");
    const data = await res.json();

    const toCsv = (rows: Record<string, unknown>[]) => {
      if (!rows.length) return "";
      const headers = Object.keys(rows[0]);
      const escape = (v: unknown) => {
        const s = v == null ? "" : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };
      return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
    };

    const downloadCsv = (filename: string, csv: string) => {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    const ts = new Date().toISOString().slice(0, 10);
    downloadCsv(`afe_use_cases_${ts}.csv`, toCsv(data.afe_use_cases));
    setTimeout(() => downloadCsv(`primary_use_case_options_${ts}.csv`, toCsv(data.primary_use_case_options)), 300);
  };

  const fetchUseCases = async () => {
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

  useEffect(() => { fetchUseCases(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return useCases.filter((uc) => {
      const matchSearch =
        !q ||
        uc.USE_CASE_NAME?.toLowerCase().includes(q) ||
        uc.ACCOUNT_NAME?.toLowerCase().includes(q) ||
        uc.USE_CASE_NUMBER?.toLowerCase().includes(q) ||
        uc.USE_CASE_LEAD_SE_NAME?.toLowerCase().includes(q) ||
        uc.ACCOUNT_OWNER_NAME?.toLowerCase().includes(q) ||
        uc.ACCOUNT_DM?.toLowerCase().includes(q) ||
        uc.PRIMARY_USE_CASE?.toLowerCase().includes(q) ||
        uc.WHO_HAS_BALL?.toLowerCase().includes(q) ||
        uc.AI_ENGAGEMENT_LEVEL?.toLowerCase().includes(q);
      const matchDistrict = districtFilter === ALL || uc.DISTRICT_NAME === districtFilter;
      const matchRank = rankFilter === ALL || uc.REPORTING_RANK === rankFilter;
      return matchSearch && matchDistrict && matchRank;
    });
  }, [useCases, search, districtFilter, rankFilter]);

  const totalEacv = filtered.reduce((s, uc) => s + (uc.USE_CASE_EACV || 0), 0);

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white/50 backdrop-blur-sm px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          AFE Use Case Tracker
        </h1>
        <Badge variant="secondary" className="ml-2 bg-violet-100 text-violet-700">#ai</Badge>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {loading ? "..." : `${filtered.length} use cases · ${formatCurrency(totalEacv)} EACV`}
          </span>
          <Button size="sm" variant="outline" onClick={downloadBackup} title="Download CSV backup">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={fetchUseCases} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="flex items-center gap-3 px-6 py-3 border-b bg-white/30">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search use cases, accounts, SE, AE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={districtFilter} onValueChange={(v) => setDistrictFilter(v ?? ALL)}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Districts</SelectItem>
              {Object.entries(DISTRICT_MAP).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rankFilter} onValueChange={(v) => setRankFilter(v ?? ALL)}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="Rank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Ranks</SelectItem>
              <SelectItem value="1 - High">1 - High</SelectItem>
              <SelectItem value="2 - Med">2 - Med</SelectItem>
              <SelectItem value="3 - Low">3 - Low</SelectItem>
              <SelectItem value="4 - No Show">4 - No Show</SelectItem>
              <SelectItem value="5 - Evaluating">5 - Evaluating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs font-semibold w-48">Account</TableHead>
                  <TableHead className="text-xs font-semibold">Use Case</TableHead>
                  <TableHead className="text-xs font-semibold w-28">UC ID</TableHead>
                  <TableHead className="text-xs font-semibold w-24">Stage</TableHead>
                  <TableHead className="text-xs font-semibold w-20 text-right">EACV</TableHead>
                  <TableHead className="text-xs font-semibold w-24">District</TableHead>
                  <TableHead className="text-xs font-semibold w-28">DM</TableHead>
                  <TableHead className="text-xs font-semibold w-28">AE</TableHead>
                  <TableHead className="text-xs font-semibold w-28">SE</TableHead>
                  <TableHead className="text-xs font-semibold w-28">PSA/AFE</TableHead>
                  <TableHead className="text-xs font-semibold w-28">Ball</TableHead>
                  <TableHead className="text-xs font-semibold w-36">AI Level</TableHead>
                  <TableHead className="text-xs font-semibold w-24">Rank</TableHead>
                  <TableHead className="text-xs font-semibold w-32">Primary UC</TableHead>
                  <TableHead className="text-xs font-semibold w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-12 text-muted-foreground text-sm">
                      {useCases.length === 0
                        ? "No #ai use cases found. Tag use cases in Salesforce with #ai in the Specialist Comments field."
                        : "No use cases match current filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((uc) => {
                    const districtInfo = uc.DISTRICT_NAME ? DISTRICT_MAP[uc.DISTRICT_NAME] : null;
                    return (
                      <TableRow key={uc.USE_CASE_ID} className="hover:bg-violet-50/30 text-sm">
                        <TableCell className="font-medium text-xs">{uc.ACCOUNT_NAME}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 max-w-[200px]">
                            <span className="truncate text-xs" title={uc.USE_CASE_NAME}>{uc.USE_CASE_NAME}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{uc.USE_CASE_NUMBER}</TableCell>
                        <TableCell>
                          {uc.USE_CASE_STAGE && (
                            <Badge variant="outline" className="text-xs px-1 py-0">{uc.USE_CASE_STAGE}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium">{formatCurrency(uc.USE_CASE_EACV)}</TableCell>
                        <TableCell>
                          {districtInfo && (
                            <Badge className="text-xs px-1 py-0 bg-violet-100 text-violet-700 border-0">{districtInfo.label}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{districtInfo?.dm || uc.ACCOUNT_DM || "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{uc.ACCOUNT_OWNER_NAME || "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{uc.USE_CASE_LEAD_SE_NAME || "-"}</TableCell>
                        <TableCell>
                          {uc.PSA_AFE_SUPPORT && (
                            <Badge variant="outline" className="text-xs px-1 py-0">{uc.PSA_AFE_SUPPORT}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{uc.WHO_HAS_BALL || "-"}</TableCell>
                        <TableCell>
                          {uc.AI_ENGAGEMENT_LEVEL && (
                            <Badge className={`text-xs px-1 py-0 border ${getEngagementColor(uc.AI_ENGAGEMENT_LEVEL)}`}>
                              {uc.AI_ENGAGEMENT_LEVEL.replace("Level ", "L")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs px-1 py-0 border ${getRankColor(uc.REPORTING_RANK)}`}>
                            {uc.REPORTING_RANK || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{uc.PRIMARY_USE_CASE || "-"}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => setEditTarget(uc)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
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
