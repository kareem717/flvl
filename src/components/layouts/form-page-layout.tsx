import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

export function FormPageLayout({
  children,
  className,
  title,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
