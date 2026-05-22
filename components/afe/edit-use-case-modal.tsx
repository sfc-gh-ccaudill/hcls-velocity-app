"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import {
  AfeUseCase,
  PrimaryUseCaseOption,
  PSA_AFE_SUPPORT_OPTIONS,
  WHO_HAS_BALL_OPTIONS,
  AI_ENGAGEMENT_LEVEL_OPTIONS,
  REPORTING_RANK_OPTIONS,
  DISTRICT_MAP,
} from "@/lib/types";

interface EditUseCaseModalProps {
  useCase: AfeUseCase | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
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

const UNSET = "__unset__";

export function EditUseCaseModal({
  useCase,
  open,
  onClose,
  onSaved,
}: EditUseCaseModalProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    psa_afe_support: "",
    who_has_ball: "",
    ai_engagement_level: "",
    reporting_rank: "",
    primary_use_case: "",
    notes: "",
  });
  const [options, setOptions] = useState<PrimaryUseCaseOption[]>([]);
  const [newOption, setNewOption] = useState("");
  const [addingOption, setAddingOption] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [editingOptionName, setEditingOptionName] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        psa_afe_support: useCase?.PSA_AFE_SUPPORT || "",
        who_has_ball: useCase?.WHO_HAS_BALL || "",
        ai_engagement_level: useCase?.AI_ENGAGEMENT_LEVEL || "",
        reporting_rank: useCase?.REPORTING_RANK || "",
        primary_use_case: useCase?.PRIMARY_USE_CASE || "",
        notes: useCase?.NOTES || "",
      });
      fetchOptions();
    }
  }, [open, useCase]);

  const fetchOptions = async () => {
    const res = await fetch("/api/afe/primary-use-cases");
    const data = await res.json();
    if (Array.isArray(data)) setOptions(data);
  };

  const handleSave = async () => {
    if (!useCase) return;
    setSaving(true);
    try {
      const payload: Record<string, string | null> = {};
      for (const [k, v] of Object.entries(form)) {
        payload[k] = v || null;
      }
      await fetch(`/api/afe/use-cases/${useCase.USE_CASE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleAddOption = async () => {
    if (!newOption.trim()) return;
    await fetch("/api/afe/primary-use-cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option_name: newOption.trim() }),
    });
    setNewOption("");
    setAddingOption(false);
    await fetchOptions();
  };

  const handleDeleteOption = async (id: number) => {
    await fetch(`/api/afe/primary-use-cases?id=${id}`, { method: "DELETE" });
    await fetchOptions();
  };

  const handleEditOption = async () => {
    if (!editingOptionId || !editingOptionName.trim()) return;
    await fetch("/api/afe/primary-use-cases", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingOptionId, option_name: editingOptionName.trim() }),
    });
    setEditingOptionId(null);
    setEditingOptionName("");
    await fetchOptions();
  };

  const districtInfo = useCase?.DISTRICT_NAME ? DISTRICT_MAP[useCase.DISTRICT_NAME] : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold leading-tight">
            {useCase?.USE_CASE_NAME}
          </DialogTitle>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{useCase?.USE_CASE_NUMBER}</Badge>
            {useCase?.USE_CASE_STAGE && (
              <Badge variant="secondary" className="text-xs">{useCase.USE_CASE_STAGE}</Badge>
            )}
            {districtInfo && (
              <Badge className="text-xs bg-violet-100 text-violet-700 border-0">{districtInfo.label}</Badge>
            )}
            {useCase?.USE_CASE_EACV ? (
              <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0">
                {formatCurrency(useCase.USE_CASE_EACV)}
              </Badge>
            ) : null}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 mt-1">
          <div><span className="font-medium text-foreground">Account:</span> {useCase?.ACCOUNT_NAME}</div>
          <div><span className="font-medium text-foreground">AE:</span> {useCase?.ACCOUNT_OWNER_NAME || "-"}</div>
          <div><span className="font-medium text-foreground">SE:</span> {useCase?.USE_CASE_LEAD_SE_NAME || "-"}</div>
          <div><span className="font-medium text-foreground">DM:</span> {districtInfo?.dm || useCase?.ACCOUNT_DM || "-"}</div>
        </div>

        {useCase?.SE_COMMENTS && (
          <div className="mt-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">SE Notes</p>
            <p className="text-xs bg-blue-50 border border-blue-100 rounded-md p-2 line-clamp-4">
              {useCase.SE_COMMENTS}
            </p>
          </div>
        )}

        {useCase?.SPECIALIST_COMMENTS && (
          <div className="mt-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Specialist Notes</p>
            <p className="text-xs bg-amber-50 border border-amber-100 rounded-md p-2 line-clamp-4">
              {useCase.SPECIALIST_COMMENTS}
            </p>
          </div>
        )}

        <Separator className="my-3" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">AFE Tracker Fields</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">PSA/AFE Support</Label>
            <Select
              value={form.psa_afe_support || UNSET}
              onValueChange={(v) => setForm({ ...form, psa_afe_support: (v && v !== UNSET) ? v : "" })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>-- None --</SelectItem>
                {PSA_AFE_SUPPORT_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Who Has the Ball</Label>
            <Select
              value={form.who_has_ball || UNSET}
              onValueChange={(v) => setForm({ ...form, who_has_ball: (v && v !== UNSET) ? v : "" })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>-- None --</SelectItem>
                {WHO_HAS_BALL_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">AI Engagement Level</Label>
            <Select
              value={form.ai_engagement_level || UNSET}
              onValueChange={(v) => setForm({ ...form, ai_engagement_level: (v && v !== UNSET) ? v : "" })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>-- None --</SelectItem>
                {AI_ENGAGEMENT_LEVEL_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reporting Rank</Label>
            <Select
              value={form.reporting_rank || UNSET}
              onValueChange={(v) => setForm({ ...form, reporting_rank: (v && v !== UNSET) ? v : "" })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>-- None --</SelectItem>
                {REPORTING_RANK_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Primary Use Case</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-2"
                onClick={() => setAddingOption(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            </div>
            <Select
              value={form.primary_use_case || UNSET}
              onValueChange={(v) => setForm({ ...form, primary_use_case: (v && v !== UNSET) ? v : "" })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>-- None --</SelectItem>
                {options.map((o) => (
                  <SelectItem key={o.ID} value={o.OPTION_NAME}>{o.OPTION_NAME}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {options.map((o) => (
                <div key={o.ID} className="flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-0.5">
                  {editingOptionId === o.ID ? (
                    <>
                      <Input
                        value={editingOptionName}
                        onChange={(e) => setEditingOptionName(e.target.value)}
                        className="h-5 w-28 text-xs px-1"
                        onKeyDown={(e) => e.key === "Enter" && handleEditOption()}
                      />
                      <button onClick={handleEditOption}><Check className="h-3 w-3 text-green-600" /></button>
                      <button onClick={() => setEditingOptionId(null)}><X className="h-3 w-3 text-red-500" /></button>
                    </>
                  ) : (
                    <>
                      <span>{o.OPTION_NAME}</span>
                      <button onClick={() => { setEditingOptionId(o.ID); setEditingOptionName(o.OPTION_NAME); }}>
                        <Pencil className="h-2.5 w-2.5 text-muted-foreground hover:text-foreground" />
                      </button>
                      <button onClick={() => handleDeleteOption(o.ID)}>
                        <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-red-500" />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {addingOption && (
                <div className="flex items-center gap-1">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className="h-6 w-32 text-xs px-1"
                    placeholder="New option..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
                    autoFocus
                  />
                  <button onClick={handleAddOption}><Check className="h-3.5 w-3.5 text-green-600" /></button>
                  <button onClick={() => { setAddingOption(false); setNewOption(""); }}><X className="h-3.5 w-3.5 text-red-500" /></button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-3">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
