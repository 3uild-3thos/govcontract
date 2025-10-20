"use client";

import * as React from "react";
import { SupportProposalModal } from "@/components/modals/SupportProposalModal";
import { CreateProposalModal } from "@/components/modals/CreateProposalModal";
import {
  CastVoteModal,
  CastVoteModalDataProps,
} from "@/components/modals/CastVoteModal";
import { ModifyVoteModal } from "@/components/modals/ModifyVoteModal";
import { OverrideVoteModal } from "@/components/modals/OverrideVoteModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

export type ModalType =
  | "support-proposal"
  | "create-proposal"
  | "cast-vote"
  | "modify-vote"
  | "override-vote"
  | "settings";

// NOTE: proposalId is the proposal's public key
interface ModalDataMap {
  "support-proposal": {
    proposalId?: string;
  };
  "create-proposal": Record<string, never>;
  "cast-vote": CastVoteModalDataProps;
  "modify-vote": {
    proposalId?: string;
  };
  "override-vote": {
    proposalId?: string;
    stakeAccount?: string;
  };
  settings: Record<string, never>;
}

interface ModalState<T extends ModalType = ModalType> {
  type: T | null;
  data?: ModalDataMap[T];
}

interface ModalContextValue {
  openModal: <T extends ModalType>(type: T, data?: ModalDataMap[T]) => void;
  closeModal: () => void;
  isOpen: (type?: ModalType) => boolean;
}

const ModalContext = React.createContext<ModalContextValue | undefined>(
  undefined
);

// Modal component map for dynamic rendering
const MODAL_COMPONENTS: Record<
  ModalType,
  React.ComponentType<{
    isOpen: boolean;
    onClose: () => void;
    [key: string]: unknown;
  }>
> = {
  "support-proposal": SupportProposalModal,
  "create-proposal": CreateProposalModal,
  "cast-vote": CastVoteModal,
  "modify-vote": ModifyVoteModal,
  "override-vote": OverrideVoteModal,
  settings: SettingsModal,
};

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = React.useState<ModalState>({
    type: null,
    data: undefined,
  });

  const openModal = React.useCallback(
    <T extends ModalType>(type: T, data?: ModalDataMap[T]) => {
      setModalState({ type, data });
    },
    []
  );

  const closeModal = React.useCallback(() => {
    setModalState({
      type: null,
      data: undefined,
    });
  }, []);

  const isOpen = React.useCallback(
    (type?: ModalType) => {
      if (type) {
        return modalState.type === type;
      }
      return modalState.type !== null;
    },
    [modalState.type]
  );

  const ActiveModal = modalState.type
    ? MODAL_COMPONENTS[modalState.type]
    : null;

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isOpen }}>
      {children}

      {ActiveModal && (
        <ActiveModal
          isOpen={true}
          onClose={closeModal}
          {...(modalState.data ?? {})}
        />
      )}
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
