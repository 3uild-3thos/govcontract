"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useEndpoint } from "@/contexts/EndpointContext";
import {
  createProposal,
  castVote,
  supportProposal,
  initializeIndex,
  TransactionResult,
} from "@/chain/instructions";

export default function GovernanceActions() {
  const wallet = useWallet();
  const { endpoint, setEndpoint, resetToDefault } = useEndpoint();
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [endpointInput, setEndpointInput] = useState(endpoint);
  const [showEndpointConfig, setShowEndpointConfig] = useState(false);

  // Update input when endpoint changes
  useEffect(() => {
    setEndpointInput(endpoint);
  }, [endpoint]);

  const handleEndpointSave = () => {
    if (endpointInput.trim()) {
      setEndpoint(endpointInput.trim());
      setShowEndpointConfig(false);
      setResult({
        signature: "",
        success: true,
        error: "RPC endpoint updated successfully!",
      });
    }
  };

  const handleEndpointReset = () => {
    resetToDefault();
    setResult({
      signature: "",
      success: true,
      error: "RPC endpoint reset to default!",
    });
  };

  const getPresetEndpoints = () => [
    { name: "Devnet", url: clusterApiUrl(WalletAdapterNetwork.Devnet) },
    { name: "Testnet", url: clusterApiUrl(WalletAdapterNetwork.Testnet) },
    { name: "Mainnet", url: clusterApiUrl(WalletAdapterNetwork.Mainnet) },
    { name: "Local", url: "http://127.0.0.1:8899" },
  ];

  const handleAction = async (
    action: () => Promise<TransactionResult>,
    actionName: string
  ) => {
    setLoading(actionName);
    setResult(null);
    
    try {
      const result = await action();
      setResult(result);
    } catch (error) {
      setResult({
        signature: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleInitializeIndex = () => {
    handleAction(
      () => initializeIndex({ wallet }),
      "Initializing Index"
    );
  };

  const handleCreateProposal = () => {
    handleAction(
      () => createProposal({
        title: "Test Proposal",
        description: "A test proposal for demonstration purposes. See: https://github.com/example/proposal",
        startEpoch: 600,
        votingLengthEpochs: 5,
        wallet,
      }),
      "Creating Proposal"
    );
  };

  const handleCastVote = () => {
    const proposalId = prompt("Enter proposal ID:");
    if (!proposalId) return;

    handleAction(
      () => castVote({
        proposalId,
        forVotesBp: 5000,
        againstVotesBp: 5000,
        abstainVotesBp: 0,
        wallet,
      }),
      "Casting Vote"
    );
  };

  const handleSupportProposal = () => {
    const proposalId = prompt("Enter proposal ID:");
    if (!proposalId) return;

    handleAction(
      () => supportProposal({
        proposalId,
        wallet,
      }),
      "Supporting Proposal"
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Governance Actions</h1>
      
      <div className="mb-6 space-y-4">
        <WalletMultiButton />
        
        {/* Endpoint Configuration */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">RPC Endpoint</h3>
            <button
              onClick={() => setShowEndpointConfig(!showEndpointConfig)}
              className="text-blue-500 text-sm hover:underline"
            >
              {showEndpointConfig ? "Hide" : "Configure"}
            </button>
          </div>
          
          <div className="text-xs text-gray-600 break-all">
            Current: {endpoint}
          </div>
          
          {showEndpointConfig && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Custom Endpoint URL</label>
                <input
                  type="text"
                  value={endpointInput}
                  onChange={(e) => setEndpointInput(e.target.value)}
                  placeholder="https://api.devnet.solana.com"
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-2">Quick Presets</label>
                <div className="flex flex-wrap gap-2">
                  {getPresetEndpoints().map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setEndpointInput(preset.url)}
                      className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleEndpointSave}
                  className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded"
                >
                  Save Endpoint
                </button>
                <button
                  onClick={handleEndpointReset}
                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded"
                >
                  Reset to Default
                </button>
                <button
                  onClick={() => setShowEndpointConfig(false)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {wallet.connected && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleInitializeIndex}
              disabled={loading === "Initializing Index"}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              {loading === "Initializing Index" ? "Loading..." : "Initialize Index"}
            </button>

            <button
              onClick={handleCreateProposal}
              disabled={loading === "Creating Proposal"}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              {loading === "Creating Proposal" ? "Loading..." : "Create Proposal"}
            </button>

            <button
              onClick={handleCastVote}
              disabled={loading === "Casting Vote"}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              {loading === "Casting Vote" ? "Loading..." : "Cast Vote"}
            </button>

            <button
              onClick={handleSupportProposal}
              disabled={loading === "Supporting Proposal"}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              {loading === "Supporting Proposal" ? "Loading..." : "Support Proposal"}
            </button>
          </div>

          {result && (
            <div className={`p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-semibold mb-2">
                {result.success ? '✅ Success' : '❌ Error'}
              </h3>
              {result.success ? (
                <div>
                  {result.signature ? (
                    <>
                      <p>Transaction: {result.signature}</p>
                      <a
                        href={`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View on Explorer
                      </a>
                    </>
                  ) : (
                    <p className="text-green-600">{result.error}</p>
                  )}
                </div>
              ) : (
                <p className="text-red-600">{result.error}</p>
              )}
            </div>
          )}
        </div>
      )}

      {!wallet.connected && (
        <p className="text-gray-600">Please connect your wallet to use governance actions.</p>
      )}
    </div>
  );
}
