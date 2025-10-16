"use client";

import * as React from "react";
import {
  Archive,
  ChevronDown,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
};

const pinned: ConversationItem[] = [
  { id: "acme-rfp", title: "Acme RFP · 时间确认", updatedAt: "2 小时前" },
  { id: "launch-brief", title: "发布会媒体沟通", updatedAt: "昨天" },
];

const recent: ConversationItem[] = [
  { id: "supplier-checkin", title: "日本供应商月度检查", updatedAt: "今天" },
  { id: "support-ticket", title: "客服工单 #4827", updatedAt: "昨天" },
  { id: "contract-revision", title: "合同条款修订", updatedAt: "周一" },
  { id: "pricing-followup", title: "报价澄清邮件", updatedAt: "上周" },
];

const archived: ConversationItem[] = [
  { id: "pilot-feedback", title: "内测体验反馈", updatedAt: "1 月 10 日" },
  { id: "holiday-offer", title: "节日营销跟进", updatedAt: "去年 12 月" },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isArchivedOpen, setArchivedOpen] = React.useState(false);

  const search = searchTerm.trim().toLowerCase();

  const filterItems = React.useCallback(
    (items: ConversationItem[]) =>
      items.filter((item) => item.title.toLowerCase().includes(search)),
    [search]
  );

  const showPinned = filterItems(pinned);
  const showRecent = filterItems(recent);
  const showArchived = filterItems(archived);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              CA
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">
                Conversation
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                Assist
              </span>
            </div>
          </div>
          <Button size="icon" variant="outline">
            <Plus className="h-4 w-4" />
            <span className="sr-only">新建会话</span>
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-3 py-4">
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜索会话…"
            className="pl-8 text-sm bg-background"
          />
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {showPinned.length > 0 && (
          <ConversationSection
            label="置顶"
            items={showPinned}
            actionIcon={<PinOff className="h-3.5 w-3.5" />}
            actionLabel="取消置顶"
            emptyLabel="暂无置顶会话"
          />
        )}
        <ConversationSection
          label="最近"
          items={showRecent}
          actionIcon={<Pin className="h-3.5 w-3.5" />}
          actionLabel="置顶"
          emptyLabel="暂无会话"
        />
        <Collapsible open={isArchivedOpen} onOpenChange={setArchivedOpen}>
          <SidebarGroup className="space-y-1">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground transition hover:bg-muted/60">
                <span className="flex items-center gap-1">
                  <Archive className="h-3.5 w-3.5" />
                  Archived
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    isArchivedOpen ? "rotate-180" : "rotate-0"
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ConversationSection
                items={showArchived}
                actionIcon={<Pin className="h-3.5 w-3.5" />}
                actionLabel="取消归档"
                label=""
                emptyLabel="暂无归档会话"
              />
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      <SidebarFooter className="border-t px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sm"
        >
          <Settings className="h-4 w-4" />
          全局设置
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

type ConversationSectionProps = {
  label?: string;
  items: ConversationItem[];
  actionIcon: React.ReactNode;
  actionLabel: string;
  emptyLabel: string;
};

function ConversationSection({
  label,
  items,
  actionIcon,
  actionLabel,
  emptyLabel,
}: ConversationSectionProps) {
  return (
    <SidebarGroup className="gap-2">
      {label ? (
        <SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </SidebarGroupLabel>
      ) : null}
      <SidebarMenu>
        {items.length === 0 ? (
          <SidebarMenuItem>
            <span className="px-2 py-1 text-xs text-muted-foreground">
              {emptyLabel}
            </span>
          </SidebarMenuItem>
        ) : (
          items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton className="text-sm" asChild>
                <button type="button">{item.title}</button>
              </SidebarMenuButton>
              <SidebarMenuAction className="text-muted-foreground" showOnHover>
                {actionIcon}
                <span className="sr-only">{actionLabel}</span>
              </SidebarMenuAction>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
