import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye } from "lucide-react";
import * as React from "react";

type ControlPanelProps = {
  tonePresets?: string[];
};

// 模拟数据 - AI 参考上下文选项
const aiReferenceContexts = [
  { id: "company-background", label: "公司背景信息", defaultChecked: true },
  { id: "project-history", label: "项目历史记录" },
  { id: "client-preferences", label: "客户偏好设置" },
  { id: "industry-knowledge", label: "行业知识库" },
];

// 模拟数据 - AI 引用上下文选项
const aiQuoteContexts = [
  { id: "previous-messages", label: "历史消息记录", defaultChecked: true },
  { id: "related-documents", label: "相关文档" },
  { id: "team-notes", label: "团队备注" },
  { id: "external-sources", label: "外部参考" },
];

export function ControlPanel({ tonePresets }: ControlPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 bg-neutral-50 relative">
      <div className="flex flex-col gap-6 pb-16">
        {/* Section 1: AI 参考上下文 */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Reference Information</h3>
            <p className="text-xs text-muted-foreground">
              选择 AI 生成回复时参考的背景信息
            </p>
          </div>
          <SelectionCard
            items={aiReferenceContexts}
            badgeText="Info"
            badgeVariant="secondary"
            badgeColor="blue"
          />
        </div>

        {/* Section 2: AI 引用上下文 */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Quoted Text</h3>
            <p className="text-xs text-muted-foreground">
              选择 AI 可以直接引用和提及的内容
            </p>
          </div>
          <SelectionCard
            items={aiQuoteContexts.map(item => ({ ...item, id: `quote-${item.id}` }))}
            badgeText="Quote"
            badgeVariant="secondary"
            badgeColor="green"
          />
        </div>

        {/* Section 3: AI 语气选择（仅在提供 tonePresets 时显示） */}
        {tonePresets && tonePresets.length > 0 ? (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Style</h3>
              <p className="text-xs text-muted-foreground">选择回复的语气和风格</p>
            </div>
            <Tabs defaultValue={tonePresets[0]} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {tonePresets.map((preset) => (
                  <TabsTrigger key={preset} value={preset} className="text-xs">
                    {preset}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        ) : null}
      </div>

      {/* 预览按钮 - 固定在底部右下角 */}
      <div className="absolute bottom-4 right-4">
        <Button variant="ghost" size="sm" className="text-xs">
          <Eye className="mr-2 h-3.5 w-3.5" />
          预览 Prompt
        </Button>
      </div>
    </div>
  );
}

// 可复用的选择卡片组件
type SelectionItem = {
  id: string;
  label: string;
  defaultChecked?: boolean;
};

type SelectionCardProps = {
  items: SelectionItem[];
  badgeText: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  badgeColor?: "blue" | "green" | "amber" | "purple" | "rose" | "gray";
  maxHeight?: string;
  className?: string;
};

function SelectionCard({
  items,
  badgeText,
  badgeVariant = "secondary",
  badgeColor = "blue",
  maxHeight = "max-h-48",
  className,
}: SelectionCardProps) {
  const colorClassMap: Record<NonNullable<SelectionCardProps["badgeColor"]>, string> = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-green-100 text-green-700 border-green-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  const colorClasses = colorClassMap[badgeColor];
  return (
    <Card className={`${maxHeight} overflow-y-auto py-2 shadow-none ${className || ""}`}>
      <CardContent className="px-4 py-2 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-2">
            <Checkbox id={item.id} defaultChecked={item.defaultChecked} />
            <Badge variant={badgeVariant} className={`text-xs ${colorClasses}`}>
              {badgeText}
            </Badge>
            <Label
              htmlFor={item.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
            >
              {item.label}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

