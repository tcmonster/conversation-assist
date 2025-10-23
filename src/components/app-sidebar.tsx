"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
} from "lucide-react";

import { SettingsDialog } from "@/components/settings/settings-dialog";
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { Conversation } from "@/providers/conversation-provider";
import { useConversations } from "@/providers/conversation-provider";
import { cn } from "@/lib/utils";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isArchivedOpen, setArchivedOpen] = React.useState(false);
  const {
    activeId,
    pinnedConversations,
    recentConversations,
    archivedConversations,
    createConversation,
    setActiveConversation,
    togglePin,
    toggleArchive,
  } = useConversations();

  const search = searchTerm.trim().toLowerCase();

  const filterItems = React.useCallback(
    (items: Conversation[]) => {
      if (!search) return items;
      return items.filter(
        (item) =>
          item.title.toLowerCase().includes(search) ||
          item.id.toLowerCase().includes(search)
      );
    },
    [search]
  );

  const filteredPinned = filterItems(pinnedConversations);
  const filteredRecent = filterItems(recentConversations);
  const filteredArchived = filterItems(archivedConversations);

  const pinnedEmptyLabel =
    pinnedConversations.length === 0 ? "暂无置顶会话" : "未找到匹配项";
  const recentEmptyLabel =
    recentConversations.length === 0 ? "暂无会话" : "未找到匹配项";
  const archivedEmptyLabel =
    archivedConversations.length === 0 ? "暂无归档会话" : "未找到匹配项";

  React.useEffect(() => {
    if (search) {
      setArchivedOpen(true);
    }
  }, [search]);

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
              <span className="text-xs leading-tight text-muted-foreground">
                Assist
              </span>
            </div>
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              createConversation();
              setSearchTerm("");
            }}
          >
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
            className="bg-background pl-8 text-sm"
          />
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {pinnedConversations.length > 0 ? (
          <ConversationSection
            label="置顶"
            items={filteredPinned}
            emptyLabel={pinnedEmptyLabel}
            actionLabel="取消置顶"
            actionIcon={PinOff}
            activeId={activeId}
            onSelect={setActiveConversation}
            onAction={togglePin}
          />
        ) : null}
        <ConversationSection
          label="最近"
          items={filteredRecent}
          emptyLabel={recentEmptyLabel}
          actionLabel="置顶"
          actionIcon={Pin}
          activeId={activeId}
          onSelect={setActiveConversation}
          onAction={togglePin}
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
                label=""
                items={filteredArchived}
                emptyLabel={archivedEmptyLabel}
                actionLabel="取消归档"
                actionIcon={ArchiveRestore}
                activeId={activeId}
                onSelect={setActiveConversation}
                onAction={toggleArchive}
              />
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      <SidebarFooter className="border-t px-3 py-2">
        <SettingsDialog>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sm"
          >
            <Settings className="h-4 w-4" />
            全局设置
          </Button>
        </SettingsDialog>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

type ConversationSectionProps = {
  label?: string;
  items: Conversation[];
  emptyLabel: string;
  actionLabel: string;
  actionIcon: LucideIcon;
  activeId: string | null;
  onSelect: (id: string) => void;
  onAction: (id: string) => void;
};

function ConversationSection({
  label,
  items,
  emptyLabel,
  actionLabel,
  actionIcon: ActionIcon,
  activeId,
  onSelect,
  onAction,
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
          items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild isActive={isActive} className="text-sm">
                  <button
                    type="button"
                    className="flex w-full items-center text-left pr-6"
                    onClick={() => onSelect(item.id)}
                  >
                    <span className="line-clamp-1">{item.title}</span>
                  </button>
                </SidebarMenuButton>
                <SidebarMenuAction
                  className="text-muted-foreground"
                  showOnHover
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onAction(item.id);
                  }}
                  aria-label={actionLabel}
                >
                  <ActionIcon className="h-3.5 w-3.5" />
                  <span className="sr-only">{actionLabel}</span>
                </SidebarMenuAction>
              </SidebarMenuItem>
            );
          })
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
