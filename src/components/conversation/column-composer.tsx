import * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ActionHandler = (
  value: string
) => void | boolean | Promise<void | boolean>;

type ColumnComposerProps = {
  label?: string;
  placeholder: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  defaultValue?: string;
  className?: string;
  disabled?: boolean;
  onPrimaryAction?: ActionHandler;
  onSecondaryAction?: ActionHandler;
};

export function ColumnComposer({
  label,
  placeholder,
  primaryActionLabel,
  secondaryActionLabel,
  defaultValue,
  className,
  disabled,
  onPrimaryAction,
  onSecondaryAction,
}: ColumnComposerProps) {
  const [value, setValue] = React.useState(defaultValue ?? "");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setValue(defaultValue ?? "");
  }, [defaultValue]);

  const focusTextarea = React.useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  const handlePrimary = React.useCallback(async () => {
    if (!onPrimaryAction || disabled) return;
    const result = await onPrimaryAction(value);
    if (result !== false) {
      setValue("");
    }
    focusTextarea();
  }, [disabled, focusTextarea, onPrimaryAction, value]);

  const handleSecondary = React.useCallback(async () => {
    if (!onSecondaryAction || disabled) return;
    const result = await onSecondaryAction(value);
    if (result !== false) {
      setValue("");
    }
    focusTextarea();
  }, [disabled, focusTextarea, onSecondaryAction, value]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void handlePrimary();
      }
    },
    [handlePrimary]
  );

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {label ? (
        <Label className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
      ) : null}
      <Textarea
        ref={textareaRef}
        placeholder={placeholder}
        className="min-h-[120px] resize-none text-sm"
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex items-center justify-end gap-2">
        {secondaryActionLabel ? (
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={disabled}
            onClick={() => void handleSecondary()}
          >
            {secondaryActionLabel}
          </Button>
        ) : null}
        <Button
          size="sm"
          type="button"
          disabled={disabled}
          onClick={() => void handlePrimary()}
        >
          {primaryActionLabel}
        </Button>
      </div>
    </div>
  );
}
