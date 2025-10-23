"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";

import { useAiWorkflow } from "@/hooks/use-ai-workflow";
import { useConversations } from "@/providers/conversation-provider";
import { useSettings } from "@/providers/settings-provider";
import { TONE_PROMPTS, type ToneKey } from "@/prompts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LANGUAGE_OPTIONS = [
  { value: "auto", label: "匹配对方语言" },
  { value: "zh-CN", label: "中文 (zh-CN)" },
  { value: "en-US", label: "English (en-US)" },
  { value: "ja-JP", label: "日本語 (ja-JP)" },
];

type ControlPanelProps = {
  intentDraft?: string;
};

type SelectionItem = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
};

type SelectionCardProps = {
  items: SelectionItem[];
  badgeText: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  badgeColor?: "blue" | "green" | "amber" | "purple" | "rose" | "gray";
  maxHeight?: string;
  className?: string;
  disabled?: boolean;
  onToggle?: (id: string, checked: boolean) => void;
};

const TONE_OPTIONS = Object.entries(TONE_PROMPTS).map(([key, value]) => ({
  id: key as ToneKey,
  label: value.label,
}));

export function ControlPanel({ intentDraft }: ControlPanelProps) {
  const { settings } = useSettings();
  const {
    activeConversation,
    setSelectedReferenceIds,
    setSelectedQuoteIds,
    setReplyLanguage,
    setTonePreset,
  } = useConversations();
  const { buildReplyPromptPreview } = useAiWorkflow();

  const [isPreviewOpen, setPreviewOpen] = React.useState(false);
  const [previewJson, setPreviewJson] = React.useState("");

  const referenceItems = React.useMemo<SelectionItem[]>(() => {
    const selectedIds = activeConversation?.selectedReferenceIds ?? [];
    return settings.references.map((item) => {
      const summary = item.content.trim();
      return {
        id: item.id,
        label: item.title,
        description:
          summary.length > 0
            ? summary.slice(0, 48) + (summary.length > 48 ? "…" : "")
            : undefined,
        checked: selectedIds.includes(item.id),
      };
    });
  }, [activeConversation?.selectedReferenceIds, settings.references]);

  const quoteItems = React.useMemo<SelectionItem[]>(() => {
    const selectedIds = activeConversation?.selectedQuoteIds ?? [];
    return settings.quotes.map((item) => {
      const summary = item.content.trim();
      return {
        id: item.id,
        label: item.title,
        description:
          summary.length > 0
            ? summary.slice(0, 48) + (summary.length > 48 ? "…" : "")
            : undefined,
        checked: selectedIds.includes(item.id),
      };
    });
  }, [activeConversation?.selectedQuoteIds, settings.quotes]);

  const handleToggleReference = React.useCallback(
    (id: string, checked: boolean) => {
      if (!activeConversation) return;
      const base = activeConversation.selectedReferenceIds;
      const next = checked
        ? Array.from(new Set([...base, id]))
        : base.filter((item) => item !== id);
      setSelectedReferenceIds(next);
    },
    [activeConversation, setSelectedReferenceIds]
  );

  const handleToggleQuote = React.useCallback(
    (id: string, checked: boolean) => {
      if (!activeConversation) return;
      const base = activeConversation.selectedQuoteIds;
      const next = checked
        ? Array.from(new Set([...base, id]))
        : base.filter((item) => item !== id);
      setSelectedQuoteIds(next);
    },
    [activeConversation, setSelectedQuoteIds]
  );

  const handleToneChange = React.useCallback(
    (value: string) => {
      if (!activeConversation) return;
      setTonePreset(value as ToneKey);
    },
    [activeConversation, setTonePreset]
  );

  const toneValue = React.useMemo(() => {
    return activeConversation?.tonePresetId ?? "concise";
  }, [activeConversation?.tonePresetId]);

  const handlePreview = React.useCallback(() => {
    try {
      const { json } = buildReplyPromptPreview({ draftIntent: intentDraft });
      setPreviewJson(json);
      setPreviewOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "无法生成 Prompt";
      toast.error("无法生成 Prompt", {
        description: message,
      });
    }
  }, [buildReplyPromptPreview, intentDraft]);

  const handleCopyPreview = React.useCallback(() => {
    if (!previewJson) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard
        .writeText(previewJson)
        .then(() => {
          toast.success("已复制 Prompt JSON");
        })
        .catch(() => {
          toast.error("复制失败", {
            description: "浏览器未授予剪贴板权限",
          });
        });
    }
  }, [previewJson]);

  const replyLanguage = activeConversation?.replyLanguage ?? "auto";

  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-neutral-50 p-4">
      <div className="flex flex-col gap-6 pb-20">
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Reply Language</h3>
            <p className="text-xs text-muted-foreground">
              选择生成回复时使用的语言
            </p>
          </div>
          <Select
            value={replyLanguage}
            onValueChange={setReplyLanguage}
            disabled={!activeConversation}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="选择语言" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Reference Information</h3>
            <p className="text-xs text-muted-foreground">
              勾选需要注入的背景资料
            </p>
          </div>
          <SelectionCard
            items={referenceItems}
            badgeText="Info"
            badgeVariant="secondary"
            badgeColor="blue"
            disabled={!activeConversation}
            onToggle={handleToggleReference}
          />
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Quoted Text</h3>
            <p className="text-xs text-muted-foreground">
              选择可直接引用的语料
            </p>
          </div>
          <SelectionCard
            items={quoteItems}
            badgeText="Quote"
            badgeVariant="secondary"
            badgeColor="green"
            disabled={!activeConversation}
            onToggle={handleToggleQuote}
          />
        </section>

        {TONE_OPTIONS.length > 0 ? (
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Style</h3>
              <p className="text-xs text-muted-foreground">配置回复语气</p>
            </div>
            <Tabs
              value={toneValue}
              onValueChange={handleToneChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                {TONE_OPTIONS.map((tone) => (
                  <TabsTrigger
                    key={tone.id}
                    value={tone.id}
                    className="text-xs"
                  >
                    {tone.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </section>
        ) : null}
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={handlePreview}
          disabled={!activeConversation}
        >
          <Eye className="mr-2 h-3.5 w-3.5" />
          预览 Prompt
        </Button>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[90vw] lg:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Prompt 预览</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <pre className="max-h-[70vh] overflow-y-auto overflow-x-auto rounded-md bg-muted p-4 text-xs leading-relaxed whitespace-pre-wrap break-words">
              {previewJson}
            </pre>
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyPreview}
                disabled={!previewJson}
              >
                复制 JSON
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SelectionCard({
  items,
  badgeText,
  badgeVariant = "secondary",
  badgeColor = "blue",
  maxHeight = "max-h-48",
  className,
  disabled,
  onToggle,
}: SelectionCardProps) {
  const colorClassMap: Record<
    NonNullable<SelectionCardProps["badgeColor"]>,
    string
  > = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-green-100 text-green-700 border-green-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  const colorClasses = colorClassMap[badgeColor];

  return (
    <Card
      className={`${maxHeight} overflow-y-auto py-2 shadow-none ${
        className || ""
      }`}
    >
      <CardContent className="space-y-2 px-4 py-2">
        {items.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            暂无可用条目
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <Checkbox
                id={item.id}
                checked={item.checked}
                disabled={disabled}
                onCheckedChange={(value) => onToggle?.(item.id, Boolean(value))}
              />
              <Badge
                variant={badgeVariant}
                className={`mt-0.5 h-5 text-xs ${colorClasses}`}
              >
                {badgeText}
              </Badge>
              <div className="flex-1">
                <Label
                  htmlFor={item.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {item.label}
                </Label>
                {item.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
