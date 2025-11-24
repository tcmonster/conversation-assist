"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  MessageSquare,
  MoreHorizontal,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
} from "lucide-react";

import { TagManagerDialog } from "@/components/settings/tag-manager-dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
import type { Conversation, ConversationTag } from "@/providers/conversation-provider";
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
    deleteConversation,
    tags,
    toggleConversationTag,
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
            <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
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
            className="group-data-[collapsible=icon]:hidden"
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
    <SidebarContent className="gap-4 px-3 py-4 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:py-3">
      <div className="relative group-data-[collapsible=icon]:hidden">
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
            activeId={activeId}
            onSelect={setActiveConversation}
            onPin={togglePin}
            onArchive={toggleArchive}
            onDelete={deleteConversation}
            onTagToggle={toggleConversationTag}
            allTags={tags}
          />
        ) : null}
        <ConversationSection
          label="最近"
          items={filteredRecent}
          emptyLabel={recentEmptyLabel}
          activeId={activeId}
          onSelect={setActiveConversation}
          onPin={togglePin}
          onArchive={toggleArchive}
          onDelete={deleteConversation}
          onTagToggle={toggleConversationTag}
          allTags={tags}
        />
        <Collapsible open={isArchivedOpen} onOpenChange={setArchivedOpen}>
          <SidebarGroup className="space-y-1">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground transition hover:bg-muted/60">
                <span className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                  <Archive className="h-3.5 w-3.5" />
                  Archived
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform group-data-[collapsible=icon]:hidden",
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
                activeId={activeId}
                onSelect={setActiveConversation}
                onPin={togglePin}
                onArchive={toggleArchive}
                onDelete={deleteConversation}
                onTagToggle={toggleConversationTag}
                allTags={tags}
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
            className="w-full justify-start gap-2 text-sm group-data-[collapsible=icon]:!h-9 group-data-[collapsible=icon]:!w-9 group-data-[collapsible=icon]:!gap-0 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0"
          >
            <Settings className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">全局设置</span>
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
  activeId: string | null;
  onSelect: (id: string) => void;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onTagToggle: (conversationId: string, tagId: string) => void;
  allTags: ConversationTag[];
};

function ConversationSection({
  label,
  items,
  emptyLabel,
  activeId,
  onSelect,
  onPin,
  onArchive,
  onDelete,
  onTagToggle,
  allTags,
}: ConversationSectionProps) {
  const [isTagManagerOpen, setTagManagerOpen] = React.useState(false);

  return (
    <SidebarGroup className="gap-2 group-data-[collapsible=icon]:px-0.5">
      {label ? (
        <SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </SidebarGroupLabel>
      ) : null}
      <SidebarMenu>
        {items.length === 0 ? (
          <SidebarMenuItem>
            <span className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              {emptyLabel}
            </span>
          </SidebarMenuItem>
        ) : (
          items.map((item) => {
            const isActive = activeId === item.id;
            const isPinned = Boolean(item.pinnedAt);
            const isArchived = Boolean(item.archivedAt);

            // Resolve tags
            const conversationTags = item.tags
              .map((tagId) => allTags.find((t) => t.id === tagId))
              .filter((t): t is ConversationTag => Boolean(t));

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.title}
                  className="h-auto items-start py-2 pr-8 text-sm group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!gap-0 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!items-center group-data-[collapsible=icon]:!mx-auto"
                  onClick={() => onSelect(item.id)}
                >
                  {isPinned ? (
                    <Star className="mt-0.5 h-4 w-4 shrink-0 fill-yellow-400 text-yellow-400 group-data-[collapsible=icon]:!mt-0" />
                  ) : (
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:!mt-0" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1 group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:items-center">
                    <span className="line-clamp-1 font-medium leading-tight">
                      {item.title}
                    </span>
                    {conversationTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {conversationTags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className={cn("h-4 px-1 py-0 text-[10px] font-normal", tag.color)}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                      <span className="sr-only">更多操作</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48"
                    side="right"
                    align="start"
                  >
                    <DropdownMenuItem onClick={() => onPin(item.id)}>
                      {isPinned ? (
                        <>
                          <PinOff className="mr-2 h-4 w-4" />
                          <span>取消置顶</span>
                        </>
                      ) : (
                        <>
                          <Pin className="mr-2 h-4 w-4" />
                          <span>置顶会话</span>
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchive(item.id)}>
                      {isArchived ? (
                        <>
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          <span>取消归档</span>
                        </>
                      ) : (
                        <>
                          <Archive className="mr-2 h-4 w-4" />
                          <span>归档会话</span>
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <span className="mr-2">#</span>
                        <span>标签</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48">
                        <DropdownMenuItem onClick={() => setTagManagerOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          <span>管理标签...</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {allTags.length === 0 ? (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            暂无标签
                          </div>
                        ) : (
                          allTags.map((tag) => (
                            <DropdownMenuCheckboxItem
                              key={tag.id}
                              checked={item.tags.includes(tag.id)}
                              onCheckedChange={() =>
                                onTagToggle(item.id, tag.id)
                              }
                            >
                              <span className={cn("mr-2 h-2 w-2 rounded-full bg-current shrink-0", tag.color.split(" ")[1])} />
                              <span className="truncate">{tag.name}</span>
                            </DropdownMenuCheckboxItem>
                          ))
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>删除会话</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          })
        )}
      </SidebarMenu>
      <TagManagerDialog open={isTagManagerOpen} onOpenChange={setTagManagerOpen} />
    </SidebarGroup>
  );
}
