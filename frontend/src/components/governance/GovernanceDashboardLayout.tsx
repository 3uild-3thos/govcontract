import type { WalletData } from "@/dummy-data/wallets";
import type { ViewType } from "@/types/governance";
import type { GovernanceDashboardStats } from "@/hooks";
import { WalletRole } from "@/lib/governance/role-detection";
import { DashboardStats } from "@/components/governance/shared/DashboardStats";
import { RoleToggle } from "@/components/governance/shared/RoleToggle";
import { GovernanceActions } from "@/components/governance/shared/GovernanceActions";
import { ValidatorActionPanel } from "@/components/governance/validator/ValidatorActionPanel";
import { StakerActionPanel } from "@/components/governance/staker/StakerActionPanel";
import { VoteAccountsTable } from "@/components/governance/validator/VoteAccountsTable";
import { StakeAccountsTable } from "@/components/governance/staker/StakeAccountsTable";
import { SummaryStats } from "@/components/governance/staker/SummaryStats";

export interface GovernanceDashboardLayoutProps {
  walletRole: WalletRole;
  selectedView: ViewType | null;
  setSelectedView: (view: ViewType) => void;
  canSwitchView: boolean;
  walletData: WalletData;
  stats: GovernanceDashboardStats;
  network: "mainnet" | "testnet" | "devnet" | "custom";
}

export function GovernanceDashboardLayout({
  walletRole,
  selectedView,
  setSelectedView,
  canSwitchView,
  walletData,
  stats,
  network,
}: GovernanceDashboardLayoutProps) {
  const activeView = selectedView ?? "validator";
  const hasSelectedView = selectedView !== null;
  const showStats = walletRole !== WalletRole.NONE && hasSelectedView;

  const showValidatorView =
    walletRole === WalletRole.VALIDATOR ||
    (walletRole === WalletRole.BOTH && selectedView === "validator");

  const showStakerView =
    walletRole === WalletRole.STAKER ||
    (walletRole === WalletRole.BOTH && selectedView === "staker");

  return (
    <>
      {/* Desktop Layout - hidden on mobile/tablet */}
      <div className="hidden lg:block">
        <div className="space-y-6">
          <div className="glass-card px-8 py-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="h2 text-foreground mb-2">
                  Governance Dashboard
                </h2>
                {walletRole !== WalletRole.NONE && (
                  <p className="text-[var(--color-dao-color-gray)] text-sm">
                    You are viewing as a{" "}
                    <span className="font-semibold gradient-text-primary-secondary">
                      {activeView === "validator" ? "Validator" : "Staker"}
                    </span>
                  </p>
                )}
              </div>
              {walletRole !== WalletRole.NONE && selectedView && (
                <RoleToggle
                  currentView={selectedView}
                  onViewChange={setSelectedView}
                  canToggle={canSwitchView}
                />
              )}
            </div>

            {showStats && selectedView && (
              <DashboardStats
                network={network}
                snapshotSlot={walletData.snapshot_slot}
                currentView={selectedView}
                delegationsReceived={stats.delegationsReceived}
                totalStaked={stats.totalStaked}
                activeValidators={walletData.stake_accounts.length}
                voteAccountsCount={walletData.vote_accounts.length}
              />
            )}
          </div>

          {showValidatorView && (
            <ValidatorActionPanel voteAccounts={walletData.vote_accounts} />
          )}

          {showStakerView && (
            <StakerActionPanel
              proposalStats={walletData.proposalStats}
              stakeAccounts={walletData.stake_accounts}
            />
          )}
        </div>
      </div>

      {/* Mobile/Tablet Layout - hidden on desktop */}
      <div className="block lg:hidden">
        <div className="space-y-10 pb-10">
          <header className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-foreground">
                  {activeView === "validator" ? "Validator" : "Staker"}
                </h1>
                <p className="text-sm text-white/60">
                  Oversee your {activeView} operations and governance.
                </p>
              </div>
              {walletRole !== WalletRole.NONE && selectedView && (
                <div className="sm:self-start">
                  <RoleToggle
                    currentView={selectedView}
                    onViewChange={setSelectedView}
                    canToggle={canSwitchView}
                  />
                </div>
              )}
            </div>
          </header>

          {showValidatorView && (
            <div className="space-y-8">
              <div className="space-y-3">
                <GovernanceActions
                  variant="validator"
                  title="Quick Actions"
                  description=""
                  wrapperClassName="space-y-4"
                  gridClassName="grid grid-cols-1 gap-y-5 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-5"
                />
              </div>

              {showStats && (
                <section className="space-y-4 pt-2 sm:pt-0">
                  <div>
                    <h3 className="h3 font-semibold text-foreground">
                      Governance Dashboard
                    </h3>
                  </div>
                  <div className="glass-card p-5">
                    <DashboardStats
                      network={network}
                      snapshotSlot={walletData.snapshot_slot}
                      currentView="validator"
                      delegationsReceived={stats.delegationsReceived}
                      totalStaked={stats.totalStaked}
                      activeValidators={walletData.stake_accounts.length}
                      voteAccountsCount={walletData.vote_accounts.length}
                    />
                  </div>
                </section>
              )}

              <VoteAccountsTable data={walletData.vote_accounts} />
            </div>
          )}

          {showStakerView && (
            <div className="space-y-8">
              <GovernanceActions
                variant="staker"
                title="Quick Actions"
                description=""
                wrapperClassName="space-y-4"
                gridClassName="grid grid-cols-1 gap-y-5 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-5"
              />

              {showStats && (
                <section className="space-y-4 pt-2 sm:pt-0">
                  <div>
                    <h3 className="h3 font-semibold">Governance Dashboard</h3>
                  </div>
                  <div className="glass-card p-5">
                    <DashboardStats
                      network={network}
                      snapshotSlot={walletData.snapshot_slot}
                      currentView="staker"
                      delegationsReceived={stats.delegationsReceived}
                      totalStaked={stats.totalStaked}
                      activeValidators={walletData.stake_accounts.length}
                      voteAccountsCount={walletData.vote_accounts.length}
                    />
                  </div>
                </section>
              )}

              <SummaryStats stats={walletData.proposalStats} />
              <StakeAccountsTable data={walletData.stake_accounts} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
