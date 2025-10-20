"use client";

import { X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface MobileRowDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function MobileRowDrawer({
  open,
  onOpenChange,
  title,
  children,
}: MobileRowDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-card border-white/10">
        <DrawerHeader className="flex flex-col gap-0 px-6 pb-2">
          <div className="flex flex-row items-center justify-between">
            <DrawerTitle className="text-xl font-semibold text-white">
              {title}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="size-5" />
              </Button>
            </DrawerClose>
          </div>
          <DrawerDescription className="sr-only">
            View detailed information about the selected {title.toLowerCase()}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">{children}</div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function DetailRow({
  label,
  value,
  className = "",
  fullWidth = false,
}: DetailRowProps) {
  return (
    <div
      className={`py-3 border-b border-white/10 ${
        fullWidth ? "col-span-2" : ""
      } ${className}`}
    >
      <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="text-sm text-white/80">{value}</div>
    </div>
  );
}
