"use client";

import * as React from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_SETTINGS,
  QuoteItem,
  ReferenceItem,
  SettingsState,
  useSettings,
} from "@/providers/settings-provider";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SettingsDialogProps = {
  children?: React.ReactNode;
};

type SettingsSection = "model" | "reference" | "quote";

type ContextType = Extract<SettingsSection, "reference" | "quote">;

type ContextEditorState =
  | { type: "reference"; item?: ReferenceItem }
  | { type: "quote"; item?: QuoteItem }
  | null;

type ContextItem = ReferenceItem | QuoteItem;

const sections: Array<{
  id: SettingsSection;
  label: string;
  description: string;
}> = [
  {
    id: "model",
    label: "模型 API",
    description: "配置模型 Base URL、密钥与默认翻译/生成模型。",
  },
  {
    id: "reference",
    label: "参考信息",
    description: "维护可供 AI 参考的上下文信息列表,例如公司背景与项目历史。",
  },
  {
    id: "quote",
    label: "引用文本",
    description: "维护可直接引用的原始文本片段,用于在回复中引用关键内容。",
  },
];

export function SettingsDialog({ children }: SettingsDialogProps) {
  const { settings, setSettings, isHydrated } = useSettings();
  const [open, setOpen] = React.useState(false);
  const [activeSection, setActiveSection] =
    React.useState<SettingsSection>("model");
  const [draft, setDraft] = React.useState<SettingsState>(DEFAULT_SETTINGS);

  React.useEffect(() => {
    if (open) {
      setDraft(settings);
    }
  }, [open, settings]);

  const selectedSection = sections.find((item) => item.id === activeSection)!;
  const [contextEditor, setContextEditor] =
    React.useState<ContextEditorState>(null);

  const handleModelFieldChange = (
    field: keyof SettingsState["models"],
    value: string
  ) => {
    setDraft((prev) => ({
      ...prev,
      models: {
        ...prev.models,
        [field]: value,
      },
    }));
  };

  const removeReference = React.useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      references: prev.references.filter((item) => item.id !== id),
    }));
  }, []);

  const removeQuote = React.useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      quotes: prev.quotes.filter((item) => item.id !== id),
    }));
  }, []);

  const persistModels = React.useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      models: { ...draft.models },
    }));
  }, [draft.models, setSettings]);

  const persistReferences = React.useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      references: draft.references.map((item) => ({ ...item })),
    }));
  }, [draft.references, setSettings]);

  const persistQuotes = React.useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      quotes: draft.quotes.map((item) => ({ ...item })),
    }));
  }, [draft.quotes, setSettings]);

  const handleSave = React.useCallback(() => {
    try {
      if (!isHydrated) {
        toast.error("设置尚未加载完成, 请稍后再试");
        return;
      }

      if (activeSection === "model") {
        persistModels();
      } else if (activeSection === "reference") {
        persistReferences();
      } else if (activeSection === "quote") {
        persistQuotes();
      }

      toast.success("设置已保存");
    } catch (error) {
      console.error("[settings] Failed to persist settings", error);
      toast.error("保存失败, 请重试");
    }
  }, [
    activeSection,
    isHydrated,
    persistModels,
    persistQuotes,
    persistReferences,
  ]);

  const openEditor = React.useCallback(
    (type: ContextType, item?: ReferenceItem | QuoteItem) => {
      setContextEditor({ type, item });
    },
    []
  );

  const handleEditorClose = React.useCallback(() => {
    setContextEditor(null);
  }, []);

  const handleEditorSubmit = React.useCallback(
    (values: { title: string; content: string }) => {
      if (!contextEditor) return;

      const normalizedTitle = values.title.trim();
      const normalizedContent = values.content.trim();
      const id = contextEditor.item?.id ?? createId();

      if (contextEditor.type === "reference") {
        setDraft((prev) => ({
          ...prev,
          references: upsertItem(prev.references, {
            id,
            title: normalizedTitle,
            content: normalizedContent,
          }),
        }));
      } else {
        setDraft((prev) => ({
          ...prev,
          quotes: upsertItem(prev.quotes, {
            id,
            title: normalizedTitle,
            content: normalizedContent,
          }),
        }));
      }

      setContextEditor(null);
    },
    [contextEditor]
  );

  const addReference = React.useCallback(() => {
    openEditor("reference");
  }, [openEditor]);

  const addQuote = React.useCallback(() => {
    openEditor("quote");
  }, [openEditor]);

  const renderSection = () => {
    if (!isHydrated) {
      return (
        <p className="text-sm text-muted-foreground">
          正在加载设置数据,请稍候…
        </p>
      );
    }

    switch (activeSection) {
      case "model":
        return (
          <div className="space-y-4" role="form" aria-label="模型 API 设置">
            <SectionField
              label="Base URL"
              htmlFor="baseUrl"
              description="模型请求使用的基础地址,为空时采用供应商默认地址。"
            >
              <Input
                id="baseUrl"
                value={draft.models.baseUrl}
                onChange={(event) =>
                  handleModelFieldChange("baseUrl", event.currentTarget.value)
                }
              />
            </SectionField>
            <SectionField
              label="API Key"
              htmlFor="apiKey"
              description="仅保存在本地浏览器,用于授权模型请求。"
            >
              <Input
                id="apiKey"
                type="password"
                value={draft.models.apiKey}
                onChange={(event) =>
                  handleModelFieldChange("apiKey", event.currentTarget.value)
                }
              />
            </SectionField>
            <Separator />
            <SectionField
              label="翻译模型"
              htmlFor="translationModel"
              description="处理翻译/解析任务的轻量模型,例如 gpt-4o-mini。"
            >
              <Input
                id="translationModel"
                value={draft.models.translationModel}
                onChange={(event) =>
                  handleModelFieldChange(
                    "translationModel",
                    event.currentTarget.value
                  )
                }
              />
            </SectionField>
            <SectionField
              label="生成模型"
              htmlFor="replyModel"
              description="用于生成高质量回复的模型,例如 gpt-4o 或 Claude 3。"
            >
              <Input
                id="replyModel"
                value={draft.models.replyModel}
                onChange={(event) =>
                  handleModelFieldChange(
                    "replyModel",
                    event.currentTarget.value
                  )
                }
              />
            </SectionField>
          </div>
        );
      case "reference":
        return (
          <ContextTable
            type="reference"
            items={draft.references}
            onAdd={addReference}
            onEdit={(item) => openEditor("reference", item)}
            onRemove={removeReference}
          />
        );
      case "quote":
        return (
          <ContextTable
            type="quote"
            items={draft.quotes}
            onAdd={addQuote}
            onEdit={(item) => openEditor("quote", item)}
            onRemove={removeQuote}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="sm">
            打开全局设置
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-hidden p-0 sm:max-w-5xl"
        showCloseButton={false}
      >
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">关闭设置</span>
          </Button>
        </DialogClose>
        <div className="flex h-[600px] min-h-[420px] divide-x divide-border">
          <aside className="hidden w-56 flex-col bg-muted/40 md:flex">
            <div className="px-5 pt-6 pb-4">
              <h2 className="text-base font-semibold">全局设置</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                配置模型与上下文资料,所有设置仅保存在本地。
              </p>
            </div>
            <nav className="flex-1 space-y-1 overflow-auto px-2 pb-4">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-sm text-left transition hover:bg-muted",
                    activeSection === section.id
                      ? "bg-background font-semibold shadow-sm ring-1 ring-border"
                      : "text-muted-foreground"
                  )}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </aside>
          <div className="flex flex-1 flex-col">
            <DialogHeader className="border-b px-6 pb-4 pt-6 text-left">
              <DialogTitle>{selectedSection.label}</DialogTitle>
              <DialogDescription>{selectedSection.description}</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {renderSection()}
            </div>
            <DialogFooter className="border-t bg-muted/20 px-6 py-4">
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={!isHydrated}
              >
                保存当前设置
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
      <ContextEditorDialog
        state={contextEditor}
        onClose={handleEditorClose}
        onSubmit={handleEditorSubmit}
      />
    </Dialog>
  );
}

type ContextTableProps = {
  type: ContextType;
  items: ContextItem[];
  onAdd: () => void;
  onEdit: (item: ContextItem) => void;
  onRemove: (id: string) => void;
};

function ContextTable({
  type,
  items,
  onAdd,
  onEdit,
  onRemove,
}: ContextTableProps) {
  const isReference = type === "reference";
  const description = isReference
    ? "维护供 AI 参考的上下文资料,例如公司背景、项目历史或客户偏好。"
    : "保存可直接引用的原文片段,用于生成回复时快速插入引用。";
  const addLabel = isReference ? "新增参考信息" : "新增引用文本";
  const emptyLabel = isReference
    ? "暂无参考信息,点击“新增参考信息”开始添加。"
    : "暂无引用文本,点击“新增引用文本”开始添加。";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{description}</span>
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          {addLabel}
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
              <TableHead className="w-[88px]">标签</TableHead>
              <TableHead className="w-[240px]">标题</TableHead>
              <TableHead>内容摘要</TableHead>
              <TableHead className="w-[120px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <ContextBadge type={type} />
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.title ? item.title : "（未命名）"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getContentPreview(item.content)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">编辑</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">删除</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除此条目?</AlertDialogTitle>
                            <AlertDialogDescription>
                              删除操作不可撤销,确认后需要点击“保存当前设置”才能同步至本地存储。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onRemove(item.id)}
                              variant="destructive"
                              className="px-3"
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type ContextEditorDialogProps = {
  state: ContextEditorState;
  onClose: () => void;
  onSubmit: (values: { title: string; content: string }) => void;
};

function ContextEditorDialog({
  state,
  onClose,
  onSubmit,
}: ContextEditorDialogProps) {
  const open = Boolean(state);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  React.useEffect(() => {
    if (state) {
      setTitle(state.item?.title ?? "");
      setContent(state.item?.content ?? "");
    }
  }, [state]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit({
        title,
        content,
      });
    },
    [content, onSubmit, title]
  );

  const isQuote = state?.type === "quote";
  const typeLabel = isQuote ? "引用文本" : "参考信息";
  const helperText = isQuote
    ? "填写可在生成回复时引用的原始文本内容。"
    : "填写供 AI 参考的背景信息或摘要。";
  const titleId = `context-${state?.type ?? "context"}-title`;
  const contentId = `context-${state?.type ?? "context"}-content`;
  const isSaveDisabled =
    title.trim().length === 0 || content.trim().length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {state?.item ? `编辑${typeLabel}` : `新增${typeLabel}`}
          </DialogTitle>
          <DialogDescription>{helperText}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <SectionField label="标题" htmlFor={titleId}>
            <Input
              id={titleId}
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
            />
          </SectionField>
          <SectionField
            label="正文内容"
            htmlFor={contentId}
            description={
              isQuote
                ? "支持粘贴原始文本或段落,不会自动翻译。"
                : "简要描述背景信息或摘要,供模型在生成时参考。"
            }
          >
            <Textarea
              id={contentId}
              value={content}
              onChange={(event) => setContent(event.currentTarget.value)}
              className="min-h-[160px] resize-y"
            />
          </SectionField>
          <DialogFooter className="px-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                取消
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={isSaveDisabled}>
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type SectionFieldProps = {
  label: string;
  htmlFor: string;
  description?: string;
  children: React.ReactNode;
};

function SectionField({
  label,
  htmlFor,
  description,
  children,
}: SectionFieldProps) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={htmlFor}>{label}</Label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function ContextBadge({ type }: { type: ContextType }) {
  const isReference = type === "reference";
  const className = isReference
    ? "border-blue-200 bg-blue-100 text-blue-700"
    : "border-green-200 bg-green-100 text-green-700";
  const label = isReference ? "Info" : "Quote";

  return (
    <Badge variant="secondary" className={cn("text-xs", className)}>
      {label}
    </Badge>
  );
}

function getContentPreview(content: string, maxLength = 96) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return "—";
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength)}…`;
}

function upsertItem<T extends ContextItem>(items: T[], item: T): T[] {
  const index = items.findIndex((entry) => entry.id === item.id);
  if (index === -1) {
    return [...items, item];
  }
  const next = items.slice();
  next[index] = item;
  return next;
}

function createId() {
  return `item-${Date.now().toString(36)}-${Math.random()
    .toString(16)
    .slice(2, 8)}`;
}
