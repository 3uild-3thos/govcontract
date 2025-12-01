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
import { cn } from "@/lib/utils";
import { AppButton } from "@/components/ui/AppButton";
import ErrorMessage from "./shared/ErrorMessage";
import { toast } from "sonner";
import { useCreateProposal } from "@/hooks";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreateProposalData {
  title: string;
  description: string;
}

export function CreateProposalModal({
  isOpen,
  onClose,
}: CreateProposalModalProps) {
  const [formData, setFormData] = React.useState<CreateProposalData>({
    title: "",
    description: "",
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const wallet = useAnchorWallet();
  const { mutate: createProposal } = useCreateProposal();

  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        description: "",
      });
      setError(undefined);
    }
  }, [isOpen]);

  const handleSuccess = () => {
    toast.success("Proposal created successfully");
    onClose();
    setIsLoading(false);
  };

  const handleError = (err: Error) => {
    console.log("error creating proposal:", err);
    setError(err instanceof Error ? err.message : "Failed to create proposal");
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      return;
    }

    setIsLoading(true);
    setError(undefined);

    console.log("Creating proposal:", formData);
    createProposal(
      {
        title: formData.title,
        description: formData.description,
        wallet,
      },
      {
        onSuccess: handleSuccess,
        onError: handleError,
      }
    );
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
    });
    setError(undefined);
    onClose();
  };

  const isFormValid = formData.title && formData.description;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="app-modal-content" showCloseButton={false}>
        <div className="app-modal-scroll-region">
          <div className="app-modal-body">
            {/* Mobile handle bar */}
            <div className="app-modal-handle" />

            <DialogHeader>
              <DialogTitle className="text-foreground">
                Create Proposal
              </DialogTitle>
              <DialogDescription className="sr-only">
                Create a new proposal by providing the required information
              </DialogDescription>
            </DialogHeader>

            <form
              id="create-proposal-form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Title Input */}
              <div className="space-y-2">
                <label
                  htmlFor="proposal-title"
                  className="text-sm font-medium text-white/80"
                >
                  Title
                </label>
                <input
                  id="proposal-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter proposal title"
                  className={cn(
                    "input",
                    "w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5",
                    "placeholder:text-sm placeholder:text-white/40 mt-1"
                  )}
                />
              </div>

              {/* Description/GitHub Link Input */}
              <div className="space-y-2">
                <label
                  htmlFor="proposal-description"
                  className="text-sm font-medium text-white/80"
                >
                  Description (GitHub Link)
                </label>
                <input
                  id="proposal-description"
                  type="url"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="https://github.com/..."
                  className={cn(
                    "input",
                    "w-full rounded-md border bg-white/5 px-3 py-1.5",
                    "placeholder:text-sm placeholder:text-white/40 mt-1"
                  )}
                />
              </div>

              {/* Error Message */}
              {error && <ErrorMessage error={error} />}
            </form>
          </div>
        </div>

        <DialogFooter className="app-modal-footer">
          <AppButton
            variant="outline"
            text="Cancel"
            size="lg"
            onClick={handleClose}
            disabled={isLoading}
          />
          <AppButton
            form="create-proposal-form"
            size="lg"
            disabled={!isFormValid || isLoading}
            onClick={handleSubmit}
            variant="gradient"
            text={isLoading ? "Creating..." : "Create Proposal"}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
