"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import {
  Clipboard,
  RefreshCw,
  Sparkles,
} from "lucide-react"

type TimelineItem = {
  id: string
  role: "contact" | "user" | "assistant"
  title: string
  content: string
  timestamp: string
}

const activeConversation = {
  id: "acme-rfp",
  title: "Acme Corp. RFP 跟进",
  counterpart: "Michael",
}

const timeline: TimelineItem[] = [
  {
    id: "msg-001",
    role: "contact",
    title: "Michael · EN 原文",
    content:
      "Hi Iris,\nThanks for sending over the initial scope. Before we finalize the paperwork, could you share a detailed delivery timeline and a breakdown of the engineering effort?",
    timestamp: "今天 09:10",
  },
  {
    id: "msg-002",
    role: "contact",
    title: "Michael · EN 追加",
    content:
      "If you have an accelerated option, let us know what trade-offs we should expect. We would appreciate receiving the full proposal by next Wednesday.",
    timestamp: "今天 09:12",
  },
  {
    id: "msg-003",
    role: "assistant",
    title: "AI 草稿 · 版本 A",
    content:
      "Hello Michael,\nThanks for your patience. We can deliver the detailed timeline by next Wednesday. The standard plan keeps design and engineering in sync, and we will share trade-offs for an accelerated option.",
    timestamp: "今天 09:20",
  },
  {
    id: "msg-004",
    role: "user",
    title: "我的手动调整",
    content:
      "已追加提醒：若需加速需提前两天确认预算调整，并强调加速方案的额外资源投入。",
    timestamp: "今天 09:28",
  },
]

const translationModes = [
  {
    id: "literal",
    label: "直译",
    content:
      "感谢您的耐心等待。我们正在协调内部资源，预计在下周三前提供完整的报价明细以及交付排期。",
  },
  {
    id: "summary",
    label: "意译",
    content:
      "对方希望下周三前拿到提案，包括交付时间和工程投入。若有提速方案，需要提前说明差异与风险。",
  },
  {
    id: "actions",
    label: "行动项",
    content: [
      "确认设计与研发是否可以并行安排。",
      "补充报价明细：人天、第三方成本、预备金。",
      "准备标准与加速两套排期方案。",
    ].join("\n"),
  },
]

const insightNotes = [
  {
    id: "insight-001",
    badge: "语气建议",
    content: "保持专业且积极的语气，可加入感谢与行动承诺，提到我们正在内部确认。",
  },
  {
    id: "insight-002",
    badge: "风险提醒",
    content: "若加速方案需额外费用或资源，需提前提示预算调整及可能的质量风险。",
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
            <div className="flex flex-1 overflow-hidden px-6 py-6">
              <section className="flex w-1/2 min-w-0 flex-col border-r pr-6">
                <ColumnHeader
                  title="对话消息"
                  description={`${activeConversation.counterpart} 的原始来信与历史草稿`}
                />
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {timeline.map((item) => (
                      <MessageItem key={item.id} item={item} />
                    ))}
                  </div>
                </ScrollArea>
                <ColumnComposer
                  label="追加原文/上下文"
                  placeholder="粘贴最新来信或补充说明…"
                  primaryActionLabel="添加到对话"
                  secondaryActionLabel="粘贴剪贴板"
                />
              </section>
              <section className="flex w-1/2 min-w-0 flex-col pl-6">
                <ColumnHeader title="解析与我的回复" description="翻译、要点与意图输出" />
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Tabs defaultValue={translationModes[0]?.id} className="w-full">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            翻译视图
                          </span>
                          <Button variant="ghost" size="sm" className="text-xs">
                            <Clipboard className="mr-2 h-3.5 w-3.5" />
                            复制解析
                          </Button>
                        </div>
                        <TabsList className="mt-2">
                          {translationModes.map((mode) => (
                            <TabsTrigger key={mode.id} value={mode.id}>
                              {mode.label}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {translationModes.map((mode) => (
                          <TabsContent key={mode.id} value={mode.id}>
                            <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                              <pre className="whitespace-pre-wrap">{mode.content}</pre>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                    <div className="space-y-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        意图与提示
                      </span>
                      <div className="space-y-2">
                        {insightNotes.map((note) => (
                          <div
                            key={note.id}
                            className="rounded-lg border border-dashed bg-background/60 p-3 text-sm leading-relaxed"
                          >
                            <Badge variant="outline" className="mb-2 text-xs">
                              {note.badge}
                            </Badge>
                            <p className="text-muted-foreground">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <ColumnComposer
                  label="我的回复草稿"
                  placeholder="整理关键回复要点或直接撰写回复…"
                  primaryActionLabel="保存草稿"
                  secondaryActionLabel="复制到剪贴板"
                  defaultValue={`Hi Michael,\n\n感谢你的耐心等待。我们已与研发团队确认资源，预计可在下周三前提交完整时间表，并同步两套排期方案（标准/加速）。如需加速，将提前与您确认额外资源与预算。\n\nBest regards,\nIris`}
                />
              </section>
            </div>
          </main>
          <aside className="hidden w-[320px] shrink-0 border-l px-6 py-6 xl:block">
            <ControlPanel />
          </aside>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function ColumnHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function MessageItem({ item }: { item: TimelineItem }) {
  const align = item.role === "user" ? "end" : "start"
  const variant =
    item.role === "user"
      ? "bg-primary text-primary-foreground"
      : item.role === "assistant"
        ? "bg-muted"
        : "bg-background"

  return (
    <div className={cn("flex flex-col gap-2", align === "end" ? "items-end" : "items-start")}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{item.title}</span>
        <span>·</span>
        <span>{item.timestamp}</span>
      </div>
      <div
        className={cn(
          "max-w-full rounded-xl border px-4 py-3 text-sm leading-relaxed shadow-sm",
          variant,
          align === "end" && "rounded-tr-sm",
          align === "start" && "rounded-tl-sm",
        )}
      >
        <pre className="whitespace-pre-wrap">{item.content}</pre>
      </div>
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
    <div className="mt-6 border-t pt-4">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Textarea
        placeholder={placeholder}
        className="mt-2 min-h-[120px] resize-none text-sm"
        defaultValue={defaultValue}
      />
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm">
          {secondaryActionLabel}
        </Button>
        <Button size="sm">{primaryActionLabel}</Button>
      </div>
    </div>
  )
}

function ControlPanel() {
  return (
    <div className="sticky top-20 flex h-[calc(100vh-8rem)] flex-col gap-6 overflow-y-auto">
      <section className="rounded-xl border bg-background p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">模型与生成</h3>
          <p className="text-xs text-muted-foreground">选择模型、语气与提示词组合</p>
        </div>
        <div className="space-y-4 text-sm">
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
