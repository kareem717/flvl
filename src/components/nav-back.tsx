"use client";

import type { ComponentPropsWithoutRef, FC } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export interface NavBackProps extends ComponentPropsWithoutRef<typeof Button> {}

export const NavBack: FC<NavBackProps> = ({ children, ...props }) => {
  const router = useRouter();

  const handleClick = () => {
    router.back();
  };

  return (
    <Button variant="ghost" size="sm" {...props} onClick={handleClick}>
      {children ?? (
        <>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </>
      )}
    </Button>
  );
};
