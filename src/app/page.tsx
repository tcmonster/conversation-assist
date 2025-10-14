"use client"

import * as React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Clipboard, RefreshCw, Sparkles } from "lucide-react"

type MessageDirection = "incoming" | "outgoing"

type TimelinePair = {
  id: string
  left: {
    direction: MessageDirection
    content: string
    timestamp: string
    canParse?: boolean
  }
  right: (
    | {
        kind: "analysis"
        summary: string
        translation: string
        followUps: string[]
      }
    | {
        kind: "intent"
        intent: string
      }
  )
}

const activeConversation = {
  id: "acme-rfp",
  title: "Acme Corp. RFP 跟进",
}

const timelinePairs: TimelinePair[] = [
  {
    id: "msg-001",
    left: {
      direction: "incoming",
      content:
        "Hi Iris,\nThanks for sending over the initial scope. Before we finalize the paperwork, could you share a detailed delivery timeline and a breakdown of the engineering effort?",
      timestamp: "今天 09:10",
      canParse: true,
    },
    right: {
      kind: "analysis",
      summary: "对方需要完整的交付排期与工程投入说明，希望确认能否与设计并行。",
      translation:
        "嗨 Iris，感谢你的初步范围。我们想先拿到详细的交付时间表以及工程人力投入的拆解，以便确认能否和设计同步推进。",
      followUps: [
        "补充标准排期与关键里程碑。",
        "拆解工程人天/角色投入，说明并行方案可行性。",
      ],
    },
  },
  {
    id: "msg-002",
    left: {
      direction: "incoming",
      content:
        "If you have an accelerated option, let us know what trade-offs we should expect. We would appreciate receiving the full proposal by next Wednesday.",
      timestamp: "今天 09:12",
      canParse: true,
    },
    right: {
      kind: "analysis",
      summary: "希望了解加速方案的成本与取舍，明确下周三前收到完整提案。",
      translation:
        "如果有加速方案，请告知可能的取舍与影响。我们希望能在下周三之前拿到完整提案。",
      followUps: ["准备加速方案的资源与风险说明。", "确认交付节点是否需要额外审批。"],
    },
  },
  {
    id: "reply-001",
    left: {
      direction: "outgoing",
      content:
        "Hi Michael,\n\n我们已同步研发团队，预计下周三前能提交包含标准与加速双方案的完整排期与投入说明。如需加速，我们会提前向你确认额外资源与预算影响。\n\nBest regards,\nIris",
      timestamp: "今天 09:32",
    },
    right: {
      kind: "intent",
      intent:
        "告知标准/加速两套排期将同步提供，强调若需提速需提前确认资源与预算调整，并确保回复语气专业、积极。",
    },
  },
]

const quickIntents = ["确认交付时间", "请求更多背景信息", "盘点风险提醒"]
const tonePresets = ["商务稳健", "友好礼貌", "简洁直接"]
const promptTags = ["商务", "售后", "报价", "合作意图"]

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="text-sm text-muted-foreground">会话中心</BreadcrumbItem>
                <BreadcrumbItem>
                  <span className="text-base font-semibold">{activeConversation.title}</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              同步最新
            </Button>
            <Button size="sm">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              生成草稿
            </Button>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <main className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col px-6 pt-6 pb-24">
              <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] gap-x-6 pb-4">
                <ColumnHeader
                  title="对话消息"
                  description="粘贴收到的消息或添加计划发送的文本"
                />
                <div aria-hidden className="w-px bg-border" />
                <ColumnHeader
                  title="解析与意图"
                  description="查看解析结果并完善回复意图"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="grid h-full grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] gap-x-6 overflow-y-auto px-1">
                  <div className="space-y-6 pr-1">
                    {timelinePairs.map((pair) => (
                      <MessageCard key={`${pair.id}-left`} data={pair.left} />
                    ))}
                  </div>
                  <div aria-hidden className="w-px bg-border" />
                  <div className="space-y-6 pl-1">
                    {timelinePairs.map((pair) => (
                      <AnalysisCard key={`${pair.id}-right`} data={pair.right} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <BottomComposer />
          </main>
          <aside className="hidden w-[320px] shrink-0 border-l px-6 py-6 xl:block">
            <ControlPanel />
          </aside>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function ColumnHeader({
  title,
  description,
  align = "start",
}: {
  title: string
  description: string
  align?: "start" | "end"
}) {
  return (
    <div className={cn("flex flex-col gap-1", align === "end" && "items-end text-right")}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

type ColumnComposerProps = {
  label: string
  placeholder: string
  primaryActionLabel: string
  secondaryActionLabel: string
  defaultValue?: string
}

function ColumnComposer({
  label,
  placeholder,
  primaryActionLabel,
  secondaryActionLabel,
  defaultValue,
}: ColumnComposerProps) {
  return (
    <div className="flex flex-col gap-3">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Textarea
        placeholder={placeholder}
        className="min-h-[140px] resize-none text-sm"
        defaultValue={defaultValue}
      />
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm">
          {secondaryActionLabel}
        </Button>
        <Button size="sm">{primaryActionLabel}</Button>
      </div>
    </div>
  )
}

function MessageCard({ data }: { data: TimelinePair["left"] }) {
  const isIncoming = data.direction === "incoming"

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-4 text-sm leading-relaxed shadow-sm",
        isIncoming ? "items-start self-start" : "items-end self-end border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted-foreground">{data.timestamp}</span>
        {isIncoming ? (
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="sr-only">解析该消息</span>
          </Button>
        ) : (
          <Button variant="outline" size="icon" className="h-7 w-7">
            <Clipboard className="h-3.5 w-3.5" />
            <span className="sr-only">复制消息</span>
          </Button>
        )}
      </div>
      <pre className={cn("whitespace-pre-wrap text-foreground", isIncoming ? "text-left" : "text-right")}>
        {data.content}
      </pre>
    </div>
  )
}

function AnalysisCard({ data }: { data: TimelinePair["right"] }) {
  if (data.kind === "analysis") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            解析结果
          </Badge>
          <Button variant="ghost" size="sm" className="text-xs">
            <Clipboard className="mr-2 h-3 w-3" />
            复制解析
          </Button>
        </div>
        <div className="space-y-2 text-sm leading-relaxed">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">摘要</p>
            <p className="mt-1 text-foreground">{data.summary}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">翻译</p>
            <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">{data.translation}</pre>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">后续动作</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
              {data.followUps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
      <Badge variant="outline" className="mb-2 text-xs">
        回复意图
      </Badge>
      <p className="text-sm leading-relaxed text-foreground">{data.intent}</p>
    </div>
  )
}

function BottomComposer() {
  return (
    <div className="sticky bottom-0 z-10 bg-background px-6 pb-6 pt-4 shadow-[0_-12px_24px_-12px_rgba(15,23,42,0.12)]">
      <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] gap-x-6">
        <ColumnComposer
          label="输入对方消息"
          placeholder="粘贴邮件或聊天原文，支持多段文本…"
          primaryActionLabel="添加消息"
          secondaryActionLabel="清空"
        />
        <div aria-hidden className="w-px bg-border" />
        <ColumnComposer
          label="撰写回复意图"
          placeholder="记录我要回复的要点、语气或希望包含的细节…"
          primaryActionLabel="生成回复"
          secondaryActionLabel="保存意图"
          defaultValue="需要在回复中说明：1) 提供标准与加速双方案；2) 加速需提前确认预算与资源；3) 保持专业、积极语气。"
        />
      </div>
    </div>
  )
}

function ControlPanel() {
  return (
    <div className="sticky top-20 flex h-[calc(100vh-8rem)] flex-col gap-6 overflow-y-auto">
      <section className="rounded-xl border bg-background p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">AI 操作</h3>
          <p className="text-xs text-muted-foreground">
            解析对方消息、调整提示词并生成最终回复
          </p>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" size="sm">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              解析选中消息
            </Button>
            <Button className="flex-1" size="sm">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              生成回复
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model-select">模型</Label>
            <Select defaultValue="gpt-4o">
              <SelectTrigger id="model-select" className="h-9 text-sm">
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o · 精准模式</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o mini · 高速模式</SelectItem>
                <SelectItem value="gemini">Gemini 1.5 · 多模态</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>目标语气</Label>
            <div className="flex flex-wrap gap-2">
              {tonePresets.map((preset) => (
                <Badge key={preset} variant={preset === "商务稳健" ? "default" : "outline"}>
                  {preset}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>快捷意图</Label>
            <div className="flex flex-wrap gap-2">
              {quickIntents.map((intent) => (
                <Button key={intent} variant="secondary" size="sm">
                  {intent}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt-notes">补充指令</Label>
            <Textarea
              id="prompt-notes"
              rows={3}
              className="resize-none text-sm"
              defaultValue="回复需包含详细排期，并提示如需调整预算请提前 2 天沟通。"
            />
          </div>
          <div className="space-y-2">
            <Label>提示词标签</Label>
            <div className="flex flex-wrap gap-2">
              {promptTags.map((tag) => (
                <Badge key={tag} variant={tag === "报价" ? "default" : "outline"}>
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <ToggleRow
              label="保留敏感上下文"
              description="模型调用时附带公司背景及历史回复"
              defaultChecked
            />
            <ToggleRow
              label="自动生成行动项"
              description="同时输出待办列表方便回顾"
            />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm">
            保存方案
          </Button>
          <Button size="sm">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            一键生成
          </Button>
        </div>
      </section>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  defaultChecked = false,
}: {
  label: string
  description: string
  defaultChecked?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  )
}
