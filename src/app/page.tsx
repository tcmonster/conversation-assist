"use client";

import * as React from "react";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Languages,
  Loader2,
  Pencil,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ColumnComposer } from "@/components/conversation/column-composer";
import { ColumnHeader } from "@/components/conversation/column-header";
import { ControlPanel } from "@/components/conversation/control-panel";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useConversations } from "@/providers/conversation-provider";
import { useAiWorkflow } from "@/hooks/use-ai-workflow";
import type {
  Conversation,
  ConversationFeedRow,
  ConversationMessageRole,
  ConversationMirror,
} from "@/providers/conversation-provider";
import { cn } from "@/lib/utils";

type FeedCell =
  | {
      type: "message";
      rowId: string;
      role: ConversationMessageRole;
      direction: "incoming" | "outgoing";
      timestamp: string;
      content: string;
    }
  | {
      type: "analysis" | "intent";
      rowId: string;
      direction: "incoming" | "outgoing";
      timestamp: string;
      content: string;
      highlights?: string[];
      status?: "idle" | "loading" | "ready" | "error";
      error?: string | null;
    };

type FeedRow = {
  id: string;
  left: FeedCell;
  right?: FeedCell;
};

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23",
});

function formatTimeLabel(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return timeFormatter.format(date);
}

function summarizeContent(content: string, fallback = "该消息") {
  const trimmed = content.trim();
  if (!trimmed) return fallback;
  return trimmed.length <= 32 ? trimmed : `${trimmed.slice(0, 32)}…`;
}

async function copyPlainText(text: string) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      toast.success("内容已复制");
      return;
    }
    throw new Error("clipboard unavailable");
  } catch (error) {
    console.error("[copy] failed", error);
    toast.error("复制失败", {
      description: "浏览器可能未授权访问剪贴板",
    });
  }
}

function shouldRenderMirror(mirror?: ConversationMirror | null) {
  if (!mirror) return false;
  const hasHighlights = Array.isArray(mirror.highlights) && mirror.highlights.length > 0;
  const hasContent = mirror.content.trim().length > 0;
  const hasStatus = mirror.status && mirror.status !== "idle";
  return hasContent || hasHighlights || hasStatus;
}

function toFeedRow(row: ConversationFeedRow): FeedRow | null {
  if (!row || !row.message) {
    return null;
  }
  const direction = row.message.role === "partner" ? "incoming" : "outgoing";

  return {
    id: row.id,
    left: {
      type: "message",
      rowId: row.id,
      role: row.message.role,
      direction,
      timestamp: formatTimeLabel(row.message.timestamp),
      content: row.message.content,
    },
    right:
      shouldRenderMirror(row.mirror)
        ? {
            type: row.mirror!.type,
            rowId: row.id,
            direction,
            timestamp: formatTimeLabel(row.mirror!.timestamp),
            content: row.mirror!.content,
            highlights: row.mirror!.highlights,
            status: row.mirror!.status,
            error: row.mirror!.error,
          }
        : undefined,
  };
}

function toFeedRows(conversation?: Conversation | null): FeedRow[] {
  if (!conversation) return [];
  return conversation.feed
    .map((row) => toFeedRow(row))
    .filter((row): row is FeedRow => Boolean(row));
}

export default function Home() {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const {
    activeConversation,
    isHydrated,
    toggleArchive,
    deleteConversation,
    renameConversation,
    addPartnerMessage,
    addSelfMessage,
    updateMessage,
    updateMirror,
    removeFeedRow,
  } = useConversations();
  const { translatePartnerMessage, generateReply } = useAiWorkflow();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editState, setEditState] = React.useState<{
    rowId: string;
   role: ConversationMessageRole;
    content: string;
  } | null>(null);
  const [editDraft, setEditDraft] = React.useState("");
  const [deleteState, setDeleteState] = React.useState<{
    rowId: string;
    label: string;
  } | null>(null);
  const [mirrorEditState, setMirrorEditState] = React.useState<{
    rowId: string;
    content: string;
  } | null>(null);
  const [mirrorEditDraft, setMirrorEditDraft] = React.useState("");
  const [intentDraft, setIntentDraft] = React.useState("");

  const feedRows = React.useMemo(
    () => toFeedRows(activeConversation),
    [activeConversation]
  );

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [activeConversation?.id, feedRows.length]);

  React.useEffect(() => {
    if (!activeConversation) {
      setDeleteDialogOpen(false);
      setIntentDraft("");
      setMirrorEditState(null);
      setMirrorEditDraft("");
    }
  }, [activeConversation]);

  React.useEffect(() => {
    if (
      editState &&
      !activeConversation?.feed.some((row) => row.id === editState.rowId)
    ) {
      setEditState(null);
      setEditDraft("");
    }
    if (
      deleteState &&
      !activeConversation?.feed.some((row) => row.id === deleteState.rowId)
    ) {
      setDeleteState(null);
    }
  }, [activeConversation, deleteState, editState]);

  const archiveLabel = activeConversation?.archivedAt ? "取消归档" : "归档";
  const ArchiveButtonIcon = activeConversation?.archivedAt
    ? ArchiveRestore
    : Archive;

  const handleArchiveToggle = React.useCallback(() => {
    if (!activeConversation) return;
    toggleArchive(activeConversation.id);
  }, [activeConversation, toggleArchive]);

  const handleConfirmDelete = React.useCallback(() => {
    if (!activeConversation) return;
    deleteConversation(activeConversation.id);
    setDeleteDialogOpen(false);
  }, [activeConversation, deleteConversation]);

  const openEditMessage = React.useCallback(
    (rowId: string, role: ConversationMessageRole, content: string) => {
      setEditState({ rowId, role, content });
      setEditDraft(content);
    },
    []
  );

  const closeEditDialog = React.useCallback(() => {
    setEditState(null);
    setEditDraft("");
  }, []);

  const handleEditSubmit = React.useCallback(() => {
    if (!editState) return;
    const trimmed = editDraft.trim();
    if (!trimmed) {
      toast.error("消息内容不能为空");
      return;
    }
    updateMessage(editState.rowId, trimmed);
    toast.success("消息已更新");
    closeEditDialog();
  }, [closeEditDialog, editDraft, editState, updateMessage]);

  const openDeleteRow = React.useCallback((rowId: string, content: string) => {
    setDeleteState({ rowId, label: summarizeContent(content) });
  }, []);

  const handleConfirmDeleteRow = React.useCallback(() => {
    if (!deleteState) return;
    removeFeedRow(deleteState.rowId);
    toast.success("消息已删除");
    setDeleteState(null);
  }, [deleteState, removeFeedRow]);

  const matrixRows = React.useMemo(() => {
    if (!activeConversation || feedRows.length === 0) {
      return [
        {
          id: "empty",
          left: <EmptyFeedCell message="暂无消息" />,
          right: <EmptyFeedCell message="暂无意图" />,
        },
      ];
    }

    const rows: Array<{
      id: string;
      left: React.ReactNode;
      right: React.ReactNode | null;
    }> = feedRows.map((row) => {
      const leftCell = row.left;
      const rightCell = row.right;
      const originalRow = activeConversation.feed.find((item) => item.id === row.id);
      const rightRetry = rightCell
        ? rightCell.type === "analysis"
          ? () => {
              void translatePartnerMessage(row.id);
            }
          : rightCell.type === "intent"
            ? () => {
                const intentSource = originalRow?.mirror?.content ?? "";
                void generateReply(intentSource, { rowId: row.id });
              }
            : undefined
        : undefined;
      const rightRetryLabel = rightCell
        ? rightCell.type === "analysis"
          ? "重新翻译"
          : rightCell.type === "intent"
            ? "重新生成"
            : undefined
        : undefined;
      return {
        id: row.id,
        left: (
          <ConversationFeedCell
            data={leftCell}
            canEdit={leftCell.type === "message"}
            onEdit={
              leftCell.type === "message"
                ? () => openEditMessage(leftCell.rowId, leftCell.role, leftCell.content)
                : undefined
            }
            onDelete={() => openDeleteRow(leftCell.rowId, leftCell.content)}
            onTranslate={
              leftCell.type === "message" && leftCell.role === "partner"
                ? () => {
                    void translatePartnerMessage(row.id);
                  }
                : undefined
            }
            onCopy={
              leftCell.type === "message" && leftCell.role === "self"
                ? () => copyPlainText(leftCell.content)
                : undefined
            }
          />
        ),
        right: rightCell ? (
          <ConversationFeedCell
            data={rightCell}
            onDelete={() => openDeleteRow(rightCell.rowId, rightCell.content)}
            onRetry={rightRetry}
            retryLabel={rightRetryLabel}
            onEdit={
              rightCell.type === "intent"
                ? () => {
                    setMirrorEditState({
                      rowId: rightCell.rowId,
                      content: rightCell.content,
                    });
                    setMirrorEditDraft(rightCell.content);
                  }
                : undefined
            }
          />
        ) : null,
      };
    });

    if (rows.length > 0 && !rows.some((row) => row.right)) {
      rows.push({
        id: `${activeConversation.id}-intent-empty`,
        left: <span />, // 保持网格占位但不显示内容
        right: <EmptyFeedCell message="暂无意图" />,
      });
    }

    return rows;
  }, [
    activeConversation,
    feedRows,
    generateReply,
    openDeleteRow,
    openEditMessage,
    translatePartnerMessage,
  ]);

  const handleAddPartnerMessage = React.useCallback(
    async (raw: string) => {
      if (!activeConversation) {
        toast.error("请选择会话后再记录消息");
        return false;
      }
      const content = raw.trim();
      if (!content) {
        toast.error("请输入对方消息内容");
        return false;
      }
      const rowId = addPartnerMessage(content);
      if (rowId) {
        void translatePartnerMessage(rowId);
      }
      toast.success("已记录对方消息");
      return true;
    },
    [activeConversation, addPartnerMessage, translatePartnerMessage]
  );

  const handleAddSelfMessage = React.useCallback(
    async (raw: string) => {
      if (!activeConversation) {
        toast.error("请选择会话后再记录消息");
        return false;
      }
      const content = raw.trim();
      if (!content) {
        toast.error("请输入我方消息内容");
        return false;
      }
      addSelfMessage(content);
      toast.success("已记录我方消息");
      return true;
    },
    [activeConversation, addSelfMessage]
  );

  const handleGenerateReply = React.useCallback(
    async (raw: string) => {
      if (!activeConversation) {
        toast.error("请选择会话后再生成回复");
        return false;
      }
      const result = await generateReply(raw);
      if (result) {
        setIntentDraft("");
      }
      return Boolean(result);
    },
    [activeConversation, generateReply]
  );

  const handleClearDraft = React.useCallback(async () => {
    setIntentDraft("");
    return true;
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-screen min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  {activeConversation ? (
                    <EditableConversationTitle
                      key={activeConversation.id}
                      title={activeConversation.title}
                      onSubmit={(nextTitle) =>
                        renameConversation(activeConversation.id, nextTitle)
                      }
                    />
                  ) : (
                    <span className="text-sm font-semibold text-foreground">
                      暂无会话
                    </span>
                  )}
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleArchiveToggle}
              disabled={!activeConversation}
            >
              <ArchiveButtonIcon className="h-4 w-4" />
              {archiveLabel}
            </Button>
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive"
                  disabled={!activeConversation}
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除会话?</AlertDialogTitle>
                  <AlertDialogDescription>
                    删除后将移除此会话的全部消息与意图,操作不可撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleConfirmDelete}
                  >
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <main className="flex flex-1 min-h-0 flex-col">
            <SectionRow
              className="shrink-0"
              left={
                <ColumnHeader title="Conversation" description="实际会话内容" />
              }
              right={<ColumnHeader title="Intention" description="对话意图" />}
            />
            <SectionRow
              variant="matrix"
              className="flex-1 min-h-0 overflow-hidden"
              gridClassName="h-full overflow-y-auto py-4"
              gridProps={{ ref: scrollContainerRef }}
              rows={matrixRows}
            />
            <SectionRow
              className="shrink-0"
              left={
                <ColumnComposer
                  placeholder="记录收到的消息或我方回复…"
                  primaryActionLabel="记录对方消息"
                  secondaryActionLabel="记录我方消息"
                  disabled={!isHydrated || !activeConversation}
                  onPrimaryAction={handleAddPartnerMessage}
                  onSecondaryAction={handleAddSelfMessage}
                />
              }
              right={
                <ColumnComposer
                  placeholder="写下想强调的回复意图或提醒事项…"
                  primaryActionLabel="生成回复"
                  secondaryActionLabel="清空"
                  disabled={!isHydrated || !activeConversation}
                  onPrimaryAction={handleGenerateReply}
                  onSecondaryAction={handleClearDraft}
                  value={intentDraft}
                  onChange={setIntentDraft}
                />
              }
            />
          </main>
          <aside className="hidden w-[360px] shrink-0 border-l xl:block">
            <ControlPanel intentDraft={intentDraft} />
          </aside>
        </div>
      </SidebarInset>
      <Dialog
        open={Boolean(editState)}
        onOpenChange={(open) => {
          if (!open) {
            closeEditDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑消息</DialogTitle>
            <DialogDescription>
              {editState?.role === "partner" ? "对方消息" : "我方消息"}将被更新并同步保存。
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="请输入新的消息内容…"
            className="min-h-[160px]"
            value={editDraft}
            onChange={(event) => setEditDraft(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" type="button" onClick={closeEditDialog}>
              取消
            </Button>
            <Button
              type="button"
              onClick={handleEditSubmit}
              disabled={!editDraft.trim()}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deleteState)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该消息?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteState?.label ?? "该消息"} 删除后不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDeleteRow}
            >
              删除
            </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <Dialog
    open={Boolean(mirrorEditState)}
    onOpenChange={(open) => {
      if (!open) {
        setMirrorEditState(null);
        setMirrorEditDraft("");
      }
    }}
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>编辑意图</DialogTitle>
        <DialogDescription>更新并保存右侧意图内容。</DialogDescription>
      </DialogHeader>
      <Textarea
        placeholder="请输入新的意图内容…"
        className="min-h-[160px]"
        value={mirrorEditDraft}
        onChange={(event) => setMirrorEditDraft(event.target.value)}
      />
      <DialogFooter>
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            setMirrorEditState(null);
            setMirrorEditDraft("");
          }}
        >
          取消
        </Button>
        <Button
          type="button"
          onClick={() => {
            if (!mirrorEditState) return;
            const trimmed = mirrorEditDraft.trim();
            if (!trimmed) {
              toast.error("意图内容不能为空");
              return;
            }
            updateMirror(mirrorEditState.rowId, {
              content: trimmed,
              status: "ready",
              error: null,
            });
            toast.success("意图已更新");
            setMirrorEditState(null);
            setMirrorEditDraft("");
          }}
          disabled={!mirrorEditDraft.trim()}
        >
          保存
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</SidebarProvider>
  );
}

function EditableConversationTitle({
  title,
  onSubmit,
}: {
  title: string;
  onSubmit: (value: string) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setValue(title);
  }, [title]);

  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commit = React.useCallback(() => {
    const trimmed = value.trim();
    setIsEditing(false);
    if (trimmed === title.trim()) {
      setValue(title);
      return;
    }
    onSubmit(trimmed);
  }, [onSubmit, title, value]);

  const cancel = React.useCallback(() => {
    setValue(title);
    setIsEditing(false);
  }, [title]);

  if (!isEditing) {
    return (
      <button
        type="button"
        className="rounded-sm px-1 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setIsEditing(true)}
        aria-label="重命名会话"
      >
        {title}
      </button>
    );
  }

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        } else if (event.key === "Escape") {
          event.preventDefault();
          cancel();
        }
      }}
      className="h-8 w-[220px] text-sm"
    />
  );
}

function EmptyFeedCell({ message = "暂无内容" }: { message?: string }) {
  return (
    <div className="flex min-h-[88px] items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 px-3 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}

function ConversationFeedCell({
  data,
  canEdit,
  onEdit,
  onDelete,
  onRetry,
  retryLabel,
  onTranslate,
  onCopy,
}: {
  data: FeedCell;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  onTranslate?: () => void;
  onCopy?: () => void;
}) {
  if (data.type === "message") {
    return (
      <MessageBubble
        data={data}
        canEdit={canEdit}
        onEdit={onEdit}
        onDelete={onDelete}
        onTranslate={onTranslate}
        onCopy={onCopy}
      />
    );
  }
  return (
    <InsightBubble
      data={data}
      onDelete={onDelete}
      onRetry={onRetry}
      retryLabel={retryLabel}
      onEdit={onEdit}
    />
  );
}

function MessageBubble({
  data,
  canEdit,
  onEdit,
  onDelete,
  onTranslate,
  onCopy,
}: {
  data: Extract<FeedCell, { type: "message" }>;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onTranslate?: () => void;
  onCopy?: () => void;
}) {
  const isIncoming = data.direction === "incoming";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 text-sm leading-relaxed",
        isIncoming ? "items-start" : "items-end"
      )}
    >
      <div
        className={cn(
          "w-fit max-w-[min(760px,85%)] rounded-2xl border px-4 py-3",
          isIncoming
            ? "border-transparent bg-neutral-900 text-background"
            : "border-border bg-background text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap">{data.content}</p>
      </div>
      <BubbleMeta
        align={isIncoming ? "start" : "end"}
        timestamp={data.timestamp}
        canEdit={canEdit}
        onEdit={onEdit}
        onDelete={onDelete}
        onTranslate={isIncoming ? onTranslate : undefined}
        onCopy={!isIncoming ? onCopy : undefined}
      />
    </div>
  );
}

function InsightBubble({
  data,
  onDelete,
  onRetry,
  retryLabel,
  onEdit,
}: {
  data: Extract<FeedCell, { type: "analysis" | "intent" }>;
  onDelete?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  onEdit?: () => void;
}) {
  const isIncoming = data.direction === "incoming";
  const status = data.status ?? "ready";
  const isLoading = status === "loading";
  const isError = status === "error";
  const content = (() => {
    const trimmed = data.content.trim();
    if (trimmed.length > 0) return data.content;
    if (isLoading) return "生成中…";
    if (isError) return data.error ?? "生成失败";
    return "";
  })();

  return (
    <div
      className={cn(
        "flex flex-col gap-2 text-sm leading-relaxed",
        isIncoming ? "items-start" : "items-end"
      )}
    >
      <div
        className={cn(
          "w-fit max-w-[min(760px,85%)] whitespace-pre-wrap rounded-2xl border px-4 py-3",
          isIncoming
            ? "border-dashed bg-muted text-foreground"
            : "border-dashed bg-card text-foreground",
          isError && "border-destructive/60 text-destructive"
        )}
      >
        {isLoading ? (
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> 正在生成
          </div>
        ) : null}
        <div>{content}</div>
        {status === "ready" && data.highlights && data.highlights.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs opacity-80">
            {data.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <BubbleMeta
        align={isIncoming ? "start" : "end"}
        timestamp={data.timestamp}
        onDelete={onDelete}
        onRetry={onRetry}
        retryLabel={retryLabel}
        isLoading={isLoading}
        canEdit={data.type === "intent"}
        onEdit={onEdit}
      />
    </div>
  );
}

function BubbleMeta({
  align,
  timestamp,
  canEdit,
  onEdit,
  onDelete,
  onRetry,
  retryLabel,
  isLoading,
  onTranslate,
  onCopy,
}: {
  align: "start" | "end";
  timestamp: string;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  isLoading?: boolean;
  onTranslate?: () => void;
  onCopy?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground",
        align === "start" ? "self-start" : "self-end"
      )}
    >
      <span>{timestamp}</span>
      {(canEdit || onDelete || onRetry || onTranslate || onCopy) && (
        <div className="flex items-center gap-1">
          {onTranslate ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onTranslate}
            >
              <Languages className="h-4 w-4" />
              <span className="sr-only">翻译</span>
            </Button>
          ) : null}
          {canEdit && onEdit ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">编辑</span>
            </Button>
          ) : null}
          {onRetry ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onRetry}
              disabled={isLoading}
              title={retryLabel ?? "重新生成"}
            >
              <RefreshCcw
                className={cn(
                  "h-4 w-4",
                  isLoading && "animate-spin"
                )}
              />
              <span className="sr-only">{retryLabel ?? "重新生成"}</span>
            </Button>
          ) : null}
          {onCopy ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onCopy}
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">复制</span>
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">删除</span>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

type SectionRowSplitProps = {
  variant?: "split";
  left: React.ReactNode;
  right: React.ReactNode;
  colors?: {
    left?: string;
    right?: string;
    divider?: string;
  };
  className?: string;
  gridClassName?: string;
  gridProps?: React.HTMLAttributes<HTMLDivElement>;
};

type SectionRowMatrixProps = {
  variant: "matrix";
  rows: Array<{
    id: string;
    left?: React.ReactNode;
    right?: React.ReactNode;
  }>;
  className?: string;
  gridClassName?: string;
  gridProps?: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  };
};

type SectionRowProps = SectionRowSplitProps | SectionRowMatrixProps;

function SectionRow(props: SectionRowProps) {
  if (props.variant === "matrix") {
    const { rows, className, gridClassName, gridProps } = props;
    const {
      className: gridPropsClassName,
      style: gridPropsStyle,
      ...gridRest
    } = gridProps ?? {};

    return (
      <div className={cn("relative min-h-0", className)}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border"
        />
        <div
          {...gridRest}
          className={cn(
            "grid h-full min-h-0 auto-rows-max grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-x-8 gap-y-4",
            gridClassName,
            gridPropsClassName
          )}
          style={{
            scrollbarGutter: "stable both-edges",
            ...gridPropsStyle,
          }}
        >
          {rows.map((row) => (
            <React.Fragment key={row.id}>
              <div className="flex h-full min-h-0 flex-col gap-2">
                {row.left ?? null}
              </div>
              <div className="flex h-full min-h-0 flex-col gap-2 pr-4">
                {row.right ?? null}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  const { left, right, colors, className, gridClassName, gridProps } = props;
  const {
    className: gridPropsClassName,
    style: gridPropsStyle,
    ...gridRest
  } = gridProps ?? {};

  return (
    <div className={cn("min-h-0", className)}>
      <div
        {...gridRest}
        className={cn(
          "grid h-full min-h-0 grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]",
          gridClassName,
          gridPropsClassName
        )}
        style={{
          scrollbarGutter: "stable both-edges",
          ...gridPropsStyle,
        }}
      >
        <div
          className={cn(
            "flex h-full flex-col items-start gap-3 p-4",
            colors?.left
          )}
        >
          {left}
        </div>
        <div aria-hidden className={cn("w-px bg-border", colors?.divider)} />
        <div
          className={cn(
            "flex h-full flex-col items-start gap-3 p-4",
            colors?.right
          )}
        >
          {right}
        </div>
      </div>
    </div>
  );
}
