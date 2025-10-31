"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AppButton } from "../ui/AppButton";
import { useEffect, useState } from "react";
import { RPC_URLS, useEndpoint } from "@/contexts/EndpointContext";
import { RPCEndpoint } from "@/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ENDPOINTS = ["mainnet", "testnet", "devnet", "custom"];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { endpointType, endpointUrl, setEndpoint } = useEndpoint();

  const [selectedEndpoint, setSelectedEndpoint] =
    useState<RPCEndpoint>(endpointType);

  const [customUrl, setCustomUrl] = useState("");

  // Sync modal state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedEndpoint(endpointType);
      setCustomUrl(endpointType === "custom" ? endpointUrl : "");
    }
  }, [isOpen, endpointType, endpointUrl]);

  const handleSave = () => {
    const url =
      selectedEndpoint === "custom" ? customUrl : RPC_URLS[selectedEndpoint];
    setEndpoint(selectedEndpoint, url);
    onClose();
  };
  const handleClose = () => {
    setSelectedEndpoint("devnet");
    setCustomUrl("");
    onClose();
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const canSave =
    selectedEndpoint !== "custom" || (customUrl && isValidUrl(customUrl));

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="app-modal-content"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <div className="app-modal-scroll-region">
          <div className="app-modal-body">
            {/* Mobile handle bar */}
            <div className="app-modal-handle" />

            <DialogHeader>
              <DialogTitle className="text-foreground">Settings</DialogTitle>
              <DialogDescription className="sr-only">
                Configure your RPC endpoint settings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/80">
                  RPC Endpoint
                </label>

                {ENDPOINTS.map((endpoint) => (
                  <label
                    key={endpoint}
                    className={cn(
                      "flex items-center gap-3 cursor-pointer p-3 mt-4 rounded-xl border transition-all",
                      selectedEndpoint === endpoint
                        ? "border-primary bg-primary/10"
                        : "border-white/10 hover:border-white/20 hover:bg-white/5"
                    )}
                  >
                    <input
                      type="radio"
                      name="rpc-endpoint"
                      value={endpoint}
                      checked={selectedEndpoint === endpoint}
                      onChange={() =>
                        setSelectedEndpoint(endpoint as RPCEndpoint)
                      }
                      className="size-3 accent-primary"
                    />
                    <span className="text-sm text-white/80 capitalize">
                      {endpoint}
                    </span>
                  </label>
                ))}

                {selectedEndpoint === "custom" && (
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="Custom RPC URL"
                    className={cn(
                      "input",
                      "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3",
                      "placeholder:text-sm placeholder:text-white/40",
                      "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="app-modal-footer">
          <AppButton
            variant="outline"
            text="Cancel"
            size="lg"
            onClick={handleClose}
          />
          <AppButton
            size="lg"
            disabled={!canSave}
            onClick={handleSave}
            variant="gradient"
            text="Save"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
