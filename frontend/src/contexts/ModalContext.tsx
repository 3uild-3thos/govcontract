/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { SupportProposalModal } from "@/components/modals/SupportProposalModal";
import { CreateProposalModal } from "@/components/modals/CreateProposalModal";
import { CastVoteModal } from "@/components/modals/CastVoteModal";
import { ModifyVoteModal } from "@/components/modals/ModifyVoteModal";
import { OverrideVoteModal } from "@/components/modals/OverrideVoteModal";
import { toast } from "sonner";

export type ModalType =
  | "support-proposal"
  | "create-proposal"
  | "cast-vote"
  | "modify-vote"
  | "override-vote";

// NOTE: proposalId is the proposal's public key
// Can pre-fill this when the public key is available
interface ModalDataMap {
  "support-proposal": {
    proposalId?: string;
  };
  "create-proposal": Record<string, never>;
  "cast-vote": {
    proposalId?: string;
  };
  "modify-vote": {
    proposalId?: string;
  };
  "override-vote": {
    proposalId?: string;
    stakeAccount?: string;
  };
}

interface ModalState<T extends ModalType = ModalType> {
  type: T | null;
  data?: ModalDataMap[T];
  isLoading?: boolean;
  error?: string;
}

interface ModalContextValue {
  openModal: <T extends ModalType>(type: T, data?: ModalDataMap[T]) => void;
  closeModal: () => void;
  isOpen: (type?: ModalType) => boolean;
}

const ModalContext = React.createContext<ModalContextValue | undefined>(
  undefined,
);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = React.useState<ModalState>({
    type: null,
    data: undefined,
    isLoading: false,
    error: undefined,
  });

  const openModal = React.useCallback(
    <T extends ModalType>(type: T, data?: ModalDataMap[T]) => {
      setModalState({ type, data, isLoading: false, error: undefined });
    },
    [],
  );

  const closeModal = React.useCallback(() => {
    setModalState({
      type: null,
      data: undefined,
      isLoading: false,
      error: undefined,
    });
  }, []);

  const isOpen = React.useCallback(
    (type?: ModalType) => {
      if (type) {
        return modalState.type === type;
      }
      return modalState.type !== null;
    },
    [modalState.type],
  );

  const handleSupportProposalSubmit = async ({
    proposalId,
  }: {
    proposalId: string;
  }) => {
    setModalState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      throw new Error("Failed to support proposal");
      console.log("Submitting support proposal:", proposalId);

      closeModal();
    } catch (error) {
      setModalState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to support proposal",
      }));
    }
  };

  const handleCreateProposalSubmit = async (data: {
    title: string;
    description: string;
    startEpoch: string;
    votingLength: string;
  }) => {
    setModalState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      closeModal();
      toast.success("Proposal created successfully");
    } catch (error) {
      setModalState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to create proposal",
      }));
    }
  };

  const handleCastVoteSubmit = async (data: {
    proposalId: string;
    distribution: { for: number; against: number; abstain: number };
  }) => {
    setModalState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Casting vote:", data);

      closeModal();
      toast.success("Vote cast successfully");
    } catch (error) {
      setModalState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to cast vote",
      }));
    }
  };

  const handleModifyVoteSubmit = async (data: unknown) => {
    setModalState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Modifying vote:", data);

      closeModal();
      toast.success("Vote modified successfully");
    } catch (error) {
      setModalState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to modify vote",
      }));
    }
  };

  const handleOverrideVoteSubmit = async (data: unknown) => {
    setModalState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Overriding vote:", data);

      closeModal();
      toast.success("Vote cast successfully");
    } catch (error) {
      setModalState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to override vote",
      }));
    }
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isOpen }}>
      {children}

      {/* Render modals based on state */}
      <SupportProposalModal
        isOpen={modalState.type === "support-proposal"}
        onClose={closeModal}
        onSubmit={handleSupportProposalSubmit}
        isLoading={modalState.isLoading}
        error={modalState.error}
        // Pass any initial data
        {...(modalState.data as ModalDataMap["support-proposal"])}
      />

      <CreateProposalModal
        isOpen={modalState.type === "create-proposal"}
        onClose={closeModal}
        onSubmit={handleCreateProposalSubmit}
        isLoading={modalState.isLoading}
        error={modalState.error}
      />

      <CastVoteModal
        isOpen={modalState.type === "cast-vote"}
        onClose={closeModal}
        onSubmit={handleCastVoteSubmit}
        isLoading={modalState.isLoading}
        error={modalState.error}
        {...(modalState.data as ModalDataMap["cast-vote"])}
      />

      <ModifyVoteModal
        isOpen={modalState.type === "modify-vote"}
        onClose={closeModal}
        onSubmit={handleModifyVoteSubmit}
        isLoading={modalState.isLoading}
        error={modalState.error}
        {...(modalState.data as ModalDataMap["modify-vote"])}
      />

      <OverrideVoteModal
        isOpen={modalState.type === "override-vote"}
        onClose={closeModal}
        onSubmit={handleOverrideVoteSubmit}
        isLoading={modalState.isLoading}
        error={modalState.error}
        {...(modalState.data as ModalDataMap["override-vote"])}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = React.useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
