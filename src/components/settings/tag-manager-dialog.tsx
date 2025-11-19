"use client";

import * as React from "react";
import { Plus, Trash2, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useConversations } from "@/providers/conversation-provider";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
    { name: "Red", value: "bg-red-100 text-red-700 border-red-200" },
    { name: "Orange", value: "bg-orange-100 text-orange-700 border-orange-200" },
    { name: "Amber", value: "bg-amber-100 text-amber-700 border-amber-200" },
    { name: "Green", value: "bg-green-100 text-green-700 border-green-200" },
    { name: "Blue", value: "bg-blue-100 text-blue-700 border-blue-200" },
    { name: "Indigo", value: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    { name: "Purple", value: "bg-purple-100 text-purple-700 border-purple-200" },
    { name: "Pink", value: "bg-pink-100 text-pink-700 border-pink-200" },
];

export function TagManagerDialog({
    children,
    open,
    onOpenChange,
}: {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const { tags, createTag, deleteTag } = useConversations();
    const [internalOpen, setInternalOpen] = React.useState(false);
    const [newTagName, setNewTagName] = React.useState("");
    const [selectedColor, setSelectedColor] = React.useState(PRESET_COLORS[4]); // Default Blue

    const isControlled = open !== undefined;
    const show = isControlled ? open : internalOpen;
    const setShow = isControlled ? onOpenChange! : setInternalOpen;

    const handleCreateTag = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newTagName.trim();
        if (!trimmed) return;

        if (tags.some((t) => t.name === trimmed)) {
            toast.error("标签名称已存在");
            return;
        }

        createTag(trimmed, selectedColor.value);
        setNewTagName("");
        toast.success("标签已创建");
    };

    const handleDeleteTag = (id: string) => {
        deleteTag(id);
        toast.success("标签已删除");
    };

    return (
        <Dialog open={show} onOpenChange={setShow}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>管理标签</DialogTitle>
                    <DialogDescription>
                        创建和管理用于分类会话的标签。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <form onSubmit={handleCreateTag} className="flex flex-col gap-4 rounded-lg border p-4 bg-muted/40">
                        <div className="space-y-2">
                            <Label htmlFor="tag-name">新标签名称</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="tag-name"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    placeholder="例如：工作、学习..."
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>选择颜色</Label>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color.name}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={cn(
                                            "h-6 w-6 rounded-full border transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                            color.value.split(" ")[0].replace("bg-", "bg-"), // extract bg color
                                            selectedColor.name === color.name ? "ring-2 ring-ring ring-offset-2 scale-110" : ""
                                        )}
                                        title={color.name}
                                        style={{ backgroundColor: "" /* let tailwind handle it */ }}
                                    >
                                        <span className="sr-only">{color.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button type="submit" disabled={!newTagName.trim()} size="sm" className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            创建标签
                        </Button>
                    </form>

                    <div className="space-y-2">
                        <Label>现有标签</Label>
                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto rounded-md border p-2">
                            {tags.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    暂无标签
                                </p>
                            ) : (
                                tags.map((tag) => (
                                    <div
                                        key={tag.id}
                                        className="flex items-center justify-between rounded-md border p-2 bg-background"
                                    >
                                        <Badge variant="secondary" className={cn("text-xs", tag.color)}>
                                            {tag.name}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDeleteTag(tag.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span className="sr-only">删除</span>
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            关闭
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
