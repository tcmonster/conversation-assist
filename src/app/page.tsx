"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  ArrowRightLeft,
  Clipboard,
  Clock,
  Filter,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react"

type Conversation = {
  id: string
  title: string
  preview: string
  language: string
  updatedAt: string
  status: "进行中" | "已完成" | "草稿"
}

const conversations: Conversation[] = [
  {
    id: "acme-rfp",
    title: "Acme Corp. RFP 跟进",
    preview: "客户希望我们提供更详细的交付时间表与定价说明…",
    language: "EN → ZH",
    updatedAt: "2 小时前",
    status: "进行中",
  },
  {
    id: "supplier-checkin",
    title: "日本供应商月度检查",
    preview: "需要确认是否能提前到货,并提醒税费流程。",
    language: "JA → ZH",
    updatedAt: "昨天",
    status: "草稿",
  },
  {
    id: "launch-brief",
    title: "产品发布媒体沟通",
    preview: "媒体希望获取一份更口语化的发布会邀请函。",
    language: "EN → ZH",
    updatedAt: "3 天前",
    status: "已完成",
  },
  {
    id: "support-ticket",
    title: "客服工单 #4827",
    preview: "用户遇到登录失败,需给出行动建议与安抚文案。",
    language: "ES → ZH",
    updatedAt: "5 天前",
    status: "进行中",
  },
  {
    id: "contract-revision",
    title: "合同条款修订",
    preview: "对方律师要求我们确认付款节点,语气需正式。",
    language: "EN → ZH",
    updatedAt: "上周",
    status: "草稿",
  },
]

const translationModes = [
  {
    id: "literal",
    label: "直译",
    content:
      "感谢您的耐心等待。我们正在协调内部资源,预计在下周三前给到完整报价与交付排期。",
  },
  {
    id: "summary",
    label: "意译",
    content:
      "我们会在内部讨论后尽快提供详细报价与交付方案,预计下周三之前完成,请您稍候。",
  },
  {
    id: "actions",
    label: "行动项",
    content: [
      "确认设计/研发资源是否可并行投入。",
      "补充报价明细:人天、第三方成本、预备金。",
      "准备两份排期:标准版与加速版。",
    ].join("\n"),
  },
]

const quickIntents = ["确认交付时间", "请求更多背景信息", "盘点风险提醒"]
const tonePresets = ["商务稳健", "友好礼貌", "简洁直接"]
const promptTags = ["商务", "售后", "报价", "合作意图"]

const activeConversationId = conversations[0]?.id

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>会话中心</BreadcrumbItem>
                <BreadcrumbItem>{conversations[0]?.title ?? "未命名会话"}</BreadcrumbItem>
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
              新建回复
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="grid flex-1 gap-6 xl:grid-cols-[320px_1fr_360px]">
            <ConversationList />
            <Workspace />
            <ControlPanel />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function ConversationList() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-2">
          <Input placeholder="搜索会话或标签…" />
          <Button size="icon" variant="secondary">
            <Plus className="h-4 w-4" />
            <span className="sr-only">新建会话</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">全部</Badge>
          <Badge variant="outline">草稿</Badge>
          <Badge variant="outline">已完成</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[300px] xl:h-full">
          <div className="space-y-2 p-4">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId

              return (
                <button
                  key={conversation.id}
                  className={cn(
                    "w-full rounded-xl border bg-muted/40 px-4 py-3 text-left transition hover:border-primary/40",
                    isActive && "border-primary bg-primary/5 shadow-sm"
                  )}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{conversation.title}</span>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                          {conversation.language}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {conversation.preview}
                      </p>
                    </div>
                    <Badge variant={conversation.status === "进行中" ? "default" : "outline"}>
                      {conversation.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>更新于 {conversation.updatedAt}</span>
                    <span>共 5 条消息</span>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="text-xs">
          <Filter className="mr-2 h-3.5 w-3.5" />
          管理标签
        </Button>
        <Button size="sm" variant="outline" className="text-xs">
          <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
          导入会话
        </Button>
      </CardFooter>
    </Card>
  )
}

function Workspace() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>输入原文</CardTitle>
            <CardDescription>快速粘贴来自邮件或聊天的原始消息</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-[240px]">
              <div className="space-y-4 p-6 text-sm leading-relaxed">
                <p>
                  Hi Iris,
                  <br />
                  Thanks for sending over the initial scope. Before we finalize the
                  paperwork, could you share a detailed delivery timeline and a breakdown of
                  the engineering effort? We need to confirm whether a parallel track with
                  design is possible.
                </p>
                <p>
                  If you have an accelerated option, let us know what trade-offs we should
                  expect. We would appreciate receiving the full proposal by next Wednesday.
                </p>
                <p>
                  Best,
                  <br />
                  Michael
                </p>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm">
              <Clipboard className="mr-2 h-3.5 w-3.5" />
              复制原文
            </Button>
            <Button size="sm">
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              重新翻译
            </Button>
          </CardFooter>
        </Card>
        <Card className="flex h-full flex-col">
          <CardHeader className="items-start gap-3">
            <div className="flex w-full items-center justify-between">
              <CardTitle>解析与翻译</CardTitle>
              <Button size="sm" variant="outline">
                <Clock className="mr-2 h-3.5 w-3.5" />
                历史译文
              </Button>
            </div>
            <CardDescription>直译、意译与行动项三种视角随时切换</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <Tabs defaultValue={translationModes[0]?.id} className="flex h-full flex-col">
              <TabsList className="mx-6">
                {translationModes.map((mode) => (
                  <TabsTrigger key={mode.id} value={mode.id}>
                    {mode.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {translationModes.map((mode) => (
                <TabsContent key={mode.id} value={mode.id} className="flex-1 px-6">
                  <ScrollArea className="h-[240px]">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {mode.content}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
          <CardFooter className="justify-end">
            <Button size="sm">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              发送到草稿
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Card className="flex flex-1 flex-col">
        <CardHeader className="flex-col items-start gap-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>AI 草稿</CardTitle>
              <CardDescription>结合意图与提示词生成的回复草稿,支持继续编辑</CardDescription>
            </div>
            <div className="flex gap-2">
              {tonePresets.map((preset) => (
                <Badge key={preset} variant="outline">
                  {preset}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <Textarea
            className="h-full min-h-[240px] resize-none text-sm leading-relaxed"
            defaultValue={`Hi Michael,\n\n感谢你的耐心等待。我们已与研发团队确认资源,目前可以按照标准排期推进:\n- 方案初稿: 周五前提交\n- 核心功能开发: 3 月第 2 周完成\n- 集成测试与交付: 3 月底\n\n如果需要加速,我们也准备了并行投放的选项,会在明天将不同方案的投入和影响整理给你。欢迎随时补充更多需求。\n\nBest regards,\nIris`}
          />
        </CardContent>
        <CardFooter className="flex items-center justify-end gap-2">
          <Button variant="outline">
            <Clipboard className="mr-2 h-4 w-4" />
            复制回复
          </Button>
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            发送外部工具
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function ControlPanel() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>提示词与模型</CardTitle>
        <CardDescription>配置语气、模型与常用方案,生成更稳定的输出</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[320px] xl:h-full px-6 py-4">
          <div className="space-y-6 text-sm">
            <div className="space-y-2">
              <Label htmlFor="model-select">模型选择</Label>
              <Select defaultValue="gpt-4o">
                <SelectTrigger id="model-select">
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
                placeholder="补充上下文、敏感词或特殊语气要求…"
                className="resize-none text-sm"
                rows={4}
                defaultValue="回复需包含详细排期,并提示如需调整预算请提前 2 天沟通。"
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
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">保留敏感上下文</p>
                  <p className="text-xs text-muted-foreground">模型调用时附带公司背景及历史回复</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">自动生成行动项</p>
                  <p className="text-xs text-muted-foreground">同时输出待办列表方便回顾</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm">
          保存方案
        </Button>
        <Button size="sm">
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          一键生成
        </Button>
      </CardFooter>
    </Card>
  )
}
