"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppButton } from "@/components/ui/AppButton";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filters: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
  }[];
  onApply: () => void;
}

export function AccountFilterModal({
  isOpen,
  onClose,
  title,
  filters,
  onApply,
}: FilterModalProps) {
  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="app-modal-content" showCloseButton={false}>
        <div className="app-modal-scroll-region">
          <div className="app-modal-body">
            {/* Mobile handle bar */}
            <div className="app-modal-handle" />

            <DialogHeader>
              <DialogTitle className="text-foreground">
                Filter {title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Apply filters to {title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {filters.map((filter, index) => (
                <div key={index} className="space-y-">
                  <label className="text-sm font-medium text-white/80">
                    {filter.label}
                  </label>
                  <Select value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger
                      className={cn(
                        "w-full text-white/60 mt-2",
                        "bg-white/5 border-white/10",
                        "focus:ring-1 focus:ring-white/20"
                      )}
                    >
                      <SelectValue placeholder={filter.placeholder} />
                    </SelectTrigger>
                    <SelectContent className="select-background">
                      {filter.options.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-foreground"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="app-modal-footer">
          <AppButton
            variant="outline"
            text="Cancel"
            size="lg"
            onClick={onClose}
          />
          <AppButton
            variant="gradient"
            text="Apply Filters"
            size="lg"
            onClick={handleApply}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
