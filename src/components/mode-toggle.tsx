"use client";

import { useTheme } from "next-themes";
import { ComponentPropsWithoutRef } from "react";
import { Sun, Moon } from "lucide-react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export function ModeToggle({
  className,
  ...props
}: Omit<
  ComponentPropsWithoutRef<typeof ToggleGroup>,
  "defaultValue" | "onValueChange" | "value" | "type"
>) {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <ToggleGroup
      {...props}
      type="single"
      onValueChange={setTheme}
      value={resolvedTheme}
      className={cn("[&>*]:w-full [&>*]:rounded-md gap-1", className)}
    >
      <ToggleGroupItem value="light" aria-label="Toggle light">
        <Sun className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Toggle dark">
        <Moon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
