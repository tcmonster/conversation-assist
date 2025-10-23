"use client";

import * as React from "react";
import { useEffect, useRef } from "react";

import { ColumnComposer } from "@/components/conversation/column-composer";
import { ColumnHeader } from "@/components/conversation/column-header";
import { ControlPanel } from "@/components/conversation/control-panel";
import { AppSidebar } from "@/components/app-sidebar";
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
import { cn } from "@/lib/utils";

const activeConversation = {
  id: "acme-rfp",
  title: "Acme Corp. RFP 跟进",
};

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

type ConversationFeedRow = {
  id: string;
  left?: FeedCell;
  right?: FeedCell;
};

const conversationFeedRows: ConversationFeedRow[] = [
  {
    id: "row-01",
    left: {
      type: "message",
      direction: "incoming",
      timestamp: "09:10",
      content:
        "Hi Iris,\nThanks for sending over the initial scope. Before we finalize the paperwork, could you share a detailed delivery timeline and a breakdown of the engineering effort?",
    },
    right: {
      type: "analysis",
      direction: "incoming",
      timestamp: "09:10",
      content:
        "翻译：嗨 Iris，请在签约前提供完整的交付时间表和工程投入拆解，以确认能否与设计并行。\n重点：需排期详情与工程角色/人天拆分。",
    },
  },
  {
    id: "row-02",
    left: {
      type: "message",
      direction: "incoming",
      timestamp: "09:18",
      content:
        "Also, could you confirm whether design assets will be delivered in parallel or sequentially?",
    },
    right: {
      type: "analysis",
      direction: "incoming",
      timestamp: "09:18",
      content:
        "翻译：请确认设计资产是与开发并行还是顺序交付。\n重点：明确设计交付依赖，避免排期冲突。",
    },
  },
  {
    id: "row-03",
    left: {
      type: "message",
      direction: "outgoing",
      timestamp: "09:32",
      content:
        "Hi Michael,\n\n我们正在汇总排期与工程投入明细，预计周三前同步标准方案与可加速选项。如需加速，我们会提前确认资源增配与预算影响。\n\nBest regards,\nIris",
    },
    right: {
      type: "intent",
      direction: "outgoing",
      timestamp: "09:32",
      content:
        "回复意图：\n- 同步标准与加速两套排期\n- 说明资源增配与预算确认流程\n- 维持专业积极语气",
    },
  },
  {
    id: "row-04",
    left: {
      type: "message",
      direction: "outgoing",
      timestamp: "09:33",
      content:
        "Deliverables will include milestone-based progress demos and a weekly status recap to keep stakeholders aligned.",
    },
    right: {
      type: "intent",
      direction: "outgoing",
      timestamp: "09:33",
      content: "补充意图：\n- 给出里程碑交付物\n- 每周同步状态以确保对齐",
    },
  },
  {
    id: "row-05",
    left: {
      type: "message",
      direction: "incoming",
      timestamp: "09:38",
      content:
        "That sounds good. Please share any assumptions you're making about backend readiness so we can flag blockers early.",
    },
    right: {
      type: "analysis",
      direction: "incoming",
      timestamp: "09:38",
      content:
        "翻译：请提供对后端就绪度的假设，以便提前发现阻塞。\n重点：列出依赖和风险提示。",
    },
  },
  {
    id: "row-06",
    left: {
      type: "message",
      direction: "outgoing",
      timestamp: "09:50",
      content:
        "We'll align with your backend owners today and follow up with a shared risk log in the proposal deck.",
    },
    right: {
      type: "intent",
      direction: "outgoing",
      timestamp: "09:50",
      content: "行动意图：\n- 与后端负责人确认依赖\n- 在提案中附上风险清单",
    },
  },
  {
    id: "row-07",
    left: {
      type: "message",
      direction: "incoming",
      timestamp: "10:05",
      content:
        "Great, appreciate the proactive planning. Looking forward to the draft by Wednesday.",
    },
    right: {
      type: "analysis",
      direction: "incoming",
      timestamp: "10:05",
      content:
        "翻译：感谢主动规划，期待周三前的方案草稿。\n重点：确认节点并保持沟通节奏。",
    },
  },
];

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 页面加载时自动滚动到底部
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
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
                  <span className="text-sm font-semibold text-foreground">
                    {activeConversation.title}
                  </span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <main className="flex flex-1 min-h-0 flex-col">
            <SectionRow
              className="shrink-0"
              left={
                <ColumnHeader
                  title="Conversation"
                  description="实际会话内容"
                />
              }
              right={
                <ColumnHeader
                  title="Intention"
                  description="对话意图"
                />
              }
            />
            <SectionRow
              variant="matrix"
              className="flex-1 min-h-0 overflow-hidden"
              gridClassName="h-full overflow-y-auto py-4"
              gridProps={{ ref: scrollContainerRef }}
              rows={conversationFeedRows.map((row) => ({
                id: row.id,
                left: row.left ? (
                  <ConversationFeedCell data={row.left} />
                ) : null,
                right: row.right ? (
                  <ConversationFeedCell data={row.right} />
                ) : null,
              }))}
            />
            <SectionRow
              className="shrink-0"
              left={
                <ColumnComposer
                  placeholder="在此记录下一步要发送的回复草稿…"
                  primaryActionLabel="添加消息"
                  secondaryActionLabel="清空"
                />
              }
              right={
                <ColumnComposer
                  placeholder="写下想强调的回复意图或提醒事项…"
                  primaryActionLabel="生成回复"
                  secondaryActionLabel="保存意图"
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

function EmptyFeedCell() {
  return (
    <div className="flex min-h-[88px] items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 text-xs text-muted-foreground">
      暂无内容
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
          "w-fit max-w-[min(520px,85%)] rounded-2xl border px-4 py-3",
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
          "w-fit max-w-[min(520px,85%)] whitespace-pre-wrap rounded-2xl border px-4 py-3",
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
