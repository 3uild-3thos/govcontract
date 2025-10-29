"use client";

import { SupportProposalModal } from "@/components/modals/SupportProposalModal";
import { CreateProposalModal } from "@/components/modals/CreateProposalModal";
import {
  CastVoteModal,
  CastVoteModalDataProps,
} from "@/components/modals/CastVoteModal";
import { ModifyVoteModal } from "@/components/modals/ModifyVoteModal";
import { OverrideVoteModal } from "@/components/modals/OverrideVoteModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import {
  ComponentType,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

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
  "override-vote": {
    proposalId?: string;
    stakeAccount?: string;
  };
  "modify-vote": {
    proposalId?: string;
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

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

// Modal component map for dynamic rendering
const MODAL_COMPONENTS: Record<
  ModalType,
  ComponentType<{
    isOpen: boolean;
    onClose: () => void;
    [key: string]: unknown;
  }>
> = {
  "support-proposal": SupportProposalModal,
  "create-proposal": CreateProposalModal,
  "cast-vote": CastVoteModal,
  "override-vote": OverrideVoteModal,
  "modify-vote": ModifyVoteModal,
  settings: SettingsModal,
};

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: undefined,
  });

  const openModal = useCallback(
    <T extends ModalType>(type: T, data?: ModalDataMap[T]) => {
      setModalState({ type, data });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalState({
      type: null,
      data: undefined,
    });
  }, []);

  const isOpen = useCallback(
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
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
