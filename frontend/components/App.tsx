"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { usePrivateSwap } from "@/hooks/usePrivateSwap";

const styles = {
  container: {
    minHeight: '100vh',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '40px',
  },
  title: {
    fontSize: '48px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #ffffff 0%, #ffd700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '12px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#a0aec0',
    fontWeight: '400',
  },
  card: {
    background: 'rgba(26, 31, 58, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    borderRadius: '24px',
    padding: '32px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  connectCard: {
    textAlign: 'center' as const,
    padding: '48px 32px',
  },
  connectButton: {
    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
    color: '#0a0e27',
    border: 'none',
    padding: '16px 48px',
    fontSize: '18px',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
  },
  infoSection: {
    marginBottom: '32px',
    padding: '20px',
    background: 'rgba(10, 14, 39, 0.5)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '14px',
  },
  infoLabel: {
    color: '#a0aec0',
    fontWeight: '500',
  },
  infoValue: {
    color: '#ffffff',
    fontWeight: '600',
    wordBreak: 'break-all' as const,
    textAlign: 'right' as const,
    maxWidth: '60%',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  },
  inputGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#ffd700',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(10, 14, 39, 0.7)',
    border: '2px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '500',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box' as const,
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  button: {
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
    color: '#0a0e27',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
  },
  secondaryButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '2px solid rgba(255, 215, 0, 0.5)',
  },
  disabledButton: {
    background: 'rgba(100, 100, 100, 0.3)',
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'not-allowed',
    border: 'none',
  },
  resultSection: {
    padding: '20px',
    background: 'rgba(255, 215, 0, 0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 215, 0, 0.3)',
  },
  resultLabel: {
    color: '#a0aec0',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
  },
  resultValue: {
    color: '#ffd700',
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '16px',
    wordBreak: 'break-all' as const,
  },
  message: {
    marginTop: '16px',
    padding: '12px 16px',
    background: 'rgba(255, 215, 0, 0.1)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '14px',
    textAlign: 'center' as const,
    border: '1px solid rgba(255, 215, 0, 0.2)',
  },
  footer: {
    marginTop: '40px',
    textAlign: 'center' as const,
    color: '#718096',
    fontSize: '14px',
  },
};

export function App() {
  const { storage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    readonlyRpcUrl,
    accounts,
  } = useMetaMaskEthersSigner();

  const { instance, status } = useFhevm({
    provider: provider ?? (typeof window !== "undefined" ? (window as any).ethereum : undefined),
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: true,
  });

  const ps = usePrivateSwap({
    instance,
    storage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [amount, setAmount] = useState<string>("1000");
  const [slippage, setSlippage] = useState<string>("5000");

  const getStatusColor = (status: string) => {
    if (status === 'ready') return { background: 'rgba(72, 187, 120, 0.2)', color: '#68d391' };
    if (status === 'loading') return { background: 'rgba(237, 137, 54, 0.2)', color: '#f6ad55' };
    return { background: 'rgba(160, 174, 192, 0.2)', color: '#a0aec0' };
  };

  const getNetworkName = (chainId: number | undefined) => {
    if (!chainId) return 'Unknown';
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      31337: 'Local Network',
    };
    return networks[chainId] || `Chain ${chainId}`;
  };

  if (!isConnected) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>PrivateSwap</h1>
          <p style={styles.subtitle}>Secure & Encrypted Token Exchange</p>
        </div>
        <div style={{ ...styles.card, ...styles.connectCard }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>🔐</div>
          <h2 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '24px' }}>Connect Your Wallet</h2>
          <p style={{ color: '#a0aec0', marginBottom: '32px', fontSize: '16px' }}>
            Connect with MetaMask to start trading privately and securely
          </p>
          <button 
            onClick={connect}
            style={styles.connectButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(255, 215, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 215, 0, 0.4)';
            }}
          >
            Connect MetaMask
          </button>
        </div>
        <div style={styles.footer}>
          <p>Powered by FHEVM - Fully Homomorphic Encryption</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>PrivateSwap</h1>
        <p style={styles.subtitle}>Your Private Trading Terminal</p>
      </div>

      <div style={styles.card}>
        {/* Status Section */}
        <div style={styles.infoSection}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Network</span>
            <span style={styles.infoValue}>{getNetworkName(chainId)}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>FHEVM Status</span>
            <span style={{
              ...styles.statusBadge,
              ...getStatusColor(status)
            }}>
              {status}
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Contract Address</span>
            <span style={styles.infoValue}>
              {ps.contractAddress ? `${ps.contractAddress.slice(0, 6)}...${ps.contractAddress.slice(-4)}` : 'Not Available'}
            </span>
          </div>
        </div>

        {/* Input Section */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Amount to Swap (Token A → Token B)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={styles.input}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#ffd700';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Maximum Slippage (PPM)</label>
          <input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            placeholder="e.g., 5000 = 0.5%"
            style={styles.input}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#ffd700';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#a0aec0' }}>
            Current slippage: {(Number(slippage) / 10000).toFixed(2)}%
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonGroup}>
          <button
            disabled={!ps.canQuote}
            onClick={() => ps.quoteAtoB(BigInt(amount), Number(slippage))}
            style={{
              ...styles.button,
              ...(ps.canQuote ? styles.primaryButton : styles.disabledButton)
            }}
            onMouseEnter={(e) => {
              if (ps.canQuote) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = ps.canQuote ? '0 4px 15px rgba(255, 215, 0, 0.3)' : 'none';
            }}
          >
            🔒 Get Quote
          </button>
          <button
            disabled={!ps.canDecrypt}
            onClick={ps.decryptLastQuote}
            style={{
              ...styles.button,
              ...(ps.canDecrypt ? styles.secondaryButton : styles.disabledButton)
            }}
            onMouseEnter={(e) => {
              if (ps.canDecrypt) {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (ps.canDecrypt) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            🔓 Decrypt Result
          </button>
        </div>

        {/* Results Section */}
        {(ps.lastQuoteHandle || ps.clearQuote !== undefined) && (
          <div style={styles.resultSection}>
            <div style={styles.resultLabel}>Quote Handle</div>
            <div style={{ ...styles.resultValue, fontSize: '14px', marginBottom: '20px' }}>
              {ps.lastQuoteHandle ? `${ps.lastQuoteHandle.slice(0, 10)}...${ps.lastQuoteHandle.slice(-8)}` : '-'}
            </div>
            
            {ps.clearQuote !== undefined && (
              <>
                <div style={styles.resultLabel}>Decrypted Amount Out</div>
                <div style={styles.resultValue}>
                  {ps.clearQuote.toString()} Tokens
                </div>
              </>
            )}
          </div>
        )}

        {/* Message */}
        {ps.message && (
          <div style={styles.message}>
            {ps.message}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <p>🔐 All trades are encrypted using Fully Homomorphic Encryption (FHE)</p>
        <p style={{ marginTop: '8px', fontSize: '12px' }}>Your privacy is our priority</p>
      </div>
    </div>
  );
}


