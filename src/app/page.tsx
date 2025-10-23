"use client";

import * as React from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
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
import { useConversations } from "@/providers/conversation-provider";
import type {
  Conversation,
  ConversationFeedRow,
} from "@/providers/conversation-provider";
import { cn } from "@/lib/utils";

const tonePresets = ["商务稳健", "友好礼貌", "简洁直接"];

type FeedCell =
  | {
      type: "message";
      direction: "incoming" | "outgoing";
      timestamp: string;
      content: string;
    }
  | {
      type: "analysis" | "intent";
      direction: "incoming" | "outgoing";
      timestamp: string;
      content: string;
      highlights?: string[];
    };

type FeedRow = {
  id: string;
  left: FeedCell;
  right: FeedCell;
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

function toFeedRow(row: ConversationFeedRow): FeedRow | null {
  if (!row || !row.message || !row.mirror) {
    return null;
  }
  const direction = row.message.role === "partner" ? "incoming" : "outgoing";

  return {
    id: row.id,
    left: {
      type: "message",
      direction,
      timestamp: formatTimeLabel(row.message.timestamp),
      content: row.message.content,
    },
    right: {
      type: row.mirror.type,
      direction,
      timestamp: formatTimeLabel(row.mirror.timestamp),
      content: row.mirror.content,
      highlights: row.mirror.highlights,
    },
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
    addIntentDraft,
  } = useConversations();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

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
    }
  }, [activeConversation]);

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

  const matrixRows = React.useMemo(() => {
    if (!activeConversation) {
      return [
        {
          id: "empty",
          left: <EmptyFeedCell message="暂无会话, 请在左侧新建" />,
          right: <EmptyFeedCell message="暂无意图" />,
        },
      ];
    }

    if (feedRows.length === 0) {
      return [
        {
          id: `${activeConversation.id}-empty`,
          left: <EmptyFeedCell message="暂无消息" />,
          right: <EmptyFeedCell message="暂无意图" />,
        },
      ];
    }

    return feedRows.map((row) => ({
      id: row.id,
      left: <ConversationFeedCell data={row.left} />,
      right: <ConversationFeedCell data={row.right} />,
    }));
  }, [activeConversation, feedRows]);

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
      addPartnerMessage(content);
      toast.success("已记录对方消息");
      return true;
    },
    [activeConversation, addPartnerMessage]
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
      addIntentDraft(raw);
      toast.success("已生成意图记录");
      return true;
    },
    [activeConversation, addIntentDraft]
  );

  const handleClearDraft = React.useCallback(async () => true, []);

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
                />
              }
            />
          </main>
          <aside className="hidden w-[360px] shrink-0 border-l xl:block">
            <ControlPanel tonePresets={tonePresets} />
          </aside>
        </div>
      </SidebarInset>
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

function ConversationFeedCell({ data }: { data: FeedCell }) {
  if (data.type === "message") {
    return <MessageBubble data={data} />;
  }
  return <InsightBubble data={data} />;
}

function MessageBubble({
  data,
}: {
  data: Extract<FeedCell, { type: "message" }>;
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
            ? "border-border text-foreground"
            : "bg-neutral-900 text-background"
        )}
      >
        <p className="whitespace-pre-wrap">{data.content}</p>
      </div>
      <span
        className={cn(
          "text-xs text-muted-foreground",
          isIncoming ? "self-start" : "self-end"
        )}
      >
        {data.timestamp}
      </span>
    </div>
  );
}

function InsightBubble({
  data,
}: {
  data: Extract<FeedCell, { type: "analysis" | "intent" }>;
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
          "w-fit max-w-[min(760px,85%)] whitespace-pre-wrap rounded-2xl border px-4 py-3",
          isIncoming
            ? "border-dashed bg-muted text-foreground"
            : "border-dashed bg-card text-foreground"
        )}
      >
        {data.content}
        {data.highlights && data.highlights.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs opacity-80">
            {data.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <span
        className={cn(
          "text-xs text-muted-foreground",
          isIncoming ? "self-start" : "self-end"
        )}
      >
        {data.timestamp}
      </span>
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
                {row.left ?? <EmptyFeedCell />}
              </div>
              <div className="flex h-full min-h-0 flex-col gap-2 pr-4">
                {row.right ?? <EmptyFeedCell />}
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
