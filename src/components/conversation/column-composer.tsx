import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ColumnComposerProps = {
  label?: string;
  placeholder: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  defaultValue?: string;
  className?: string;
};

export function ColumnComposer({
  label,
  placeholder,
  primaryActionLabel,
  secondaryActionLabel,
  defaultValue,
  className,
}: ColumnComposerProps) {
  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {label ? (
        <Label className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
      ) : null}
      <Textarea
        placeholder={placeholder}
        className="min-h-[120px] resize-none text-sm"
        defaultValue={defaultValue}
      />
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm">
          {secondaryActionLabel}
        </Button>
        <Button size="sm">{primaryActionLabel}</Button>
      </div>
    </div>
  );
}
