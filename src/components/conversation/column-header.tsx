import { cn } from "@/lib/utils";

type ColumnHeaderProps = {
  title: string;
  description: string;
  align?: "start" | "end";
};

export function ColumnHeader({
  title,
  description,
  align = "start",
}: ColumnHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "end" && "items-end text-right"
      )}
    >
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
