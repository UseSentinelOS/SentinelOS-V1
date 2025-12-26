import { useState, useEffect, useCallback } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";

export type SolanaNetwork = "mainnet-beta";

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: { toBase58(): string };
  isConnected?: boolean;
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array, encoding: string): Promise<{ signature: Uint8Array }>;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
}

interface WalletState {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  balance: number | null;
  provider: PhantomProvider | null;
  network: SolanaNetwork;
}

const NETWORK_STORAGE_KEY = "sentinel_solana_network";

function getStoredNetwork(): SolanaNetwork {
  return "mainnet-beta";
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    connected: false,
    connecting: false,
    publicKey: null,
    balance: null,
    provider: null,
    network: getStoredNetwork(),
  });

  const getRpcUrl = useCallback(() => {
    const rpcEndpoints = [
      "https://api.mainnet-beta.solana.com",
      "https://solana-mainnet.g.alchemy.com/v2/demo",
      "https://rpc.ankr.com/solana",
    ];
    return rpcEndpoints[0];
  }, [state.network]);

  const getProvider = useCallback((): PhantomProvider | null => {
    if (typeof window !== "undefined" && "solana" in window) {
      const provider = (window as unknown as { solana: PhantomProvider }).solana;
      if (provider?.isPhantom) {
        return provider;
      }
    }
    return null;
  }, []);

  const fetchBalance = useCallback(async (publicKeyStr: string) => {
    try {
      const response = await fetch(`/api/wallet/balance/${publicKeyStr}`);
      if (response.ok) {
        const data = await response.json();
        setState((prev) => ({ ...prev, balance: data.balance }));
        return;
      }
      console.error("Backend balance fetch failed:", await response.text());
    } catch (error) {
      console.error("Failed to fetch balance from backend:", error);
    }
    
    const rpcEndpoints = [
      "https://api.mainnet-beta.solana.com",
      "https://rpc.ankr.com/solana",
    ];
    
    for (const rpc of rpcEndpoints) {
      try {
        const connection = new Connection(rpc, "confirmed");
        const publicKey = new PublicKey(publicKeyStr);
        const balance = await connection.getBalance(publicKey);
        setState((prev) => ({ ...prev, balance: balance / LAMPORTS_PER_SOL }));
        return;
      } catch (error) {
        console.error(`Failed to fetch balance from ${rpc}:`, error);
      }
    }
    console.error("All RPC endpoints failed");
  }, []);

  
  useEffect(() => {
    if (state.publicKey && state.network) {
      fetchBalance(state.publicKey);
    }
  }, [state.network, state.publicKey, fetchBalance]);

  const connect = useCallback(async () => {
    const provider = getProvider();

    if (!provider) {
      window.open("https://phantom.app/", "_blank");
      return;
    }

    setState((prev) => ({ ...prev, connecting: true }));

    try {
      const response = await provider.connect();
      const publicKey = response.publicKey.toBase58();

      setState((prev) => ({
        ...prev,
        connected: true,
        connecting: false,
        publicKey,
        provider,
      }));

      fetchBalance(publicKey);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setState((prev) => ({ ...prev, connecting: false }));
    }
  }, [getProvider, fetchBalance]);

  const disconnect = useCallback(async () => {
    const provider = getProvider();

    if (provider) {
      try {
        await provider.disconnect();
      } catch (error) {
        console.error("Failed to disconnect:", error);
      }
    }

    setState((prev) => ({
      ...prev,
      connected: false,
      connecting: false,
      publicKey: null,
      balance: null,
      provider: null,
    }));
  }, [getProvider]);

  useEffect(() => {
    const provider = getProvider();

    if (provider?.isConnected && provider.publicKey) {
      const publicKey = provider.publicKey.toBase58();
      setState((prev) => ({
        ...prev,
        connected: true,
        publicKey,
        provider,
      }));
      fetchBalance(publicKey);
    }

    const handleAccountChange = (publicKey: { toBase58(): string } | null) => {
      if (publicKey) {
        const pubKeyStr = publicKey.toBase58();
        setState((prev) => ({ ...prev, publicKey: pubKeyStr }));
        fetchBalance(pubKeyStr);
      } else {
        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          publicKey: null,
          balance: null,
          provider: null,
        }));
      }
    };

    const handleDisconnect = () => {
      setState((prev) => ({
        ...prev,
        connected: false,
        connecting: false,
        publicKey: null,
        balance: null,
        provider: null,
      }));
    };

    if (provider) {
      provider.on("accountChanged", handleAccountChange as (...args: unknown[]) => void);
      provider.on("disconnect", handleDisconnect);
    }

    return () => {
      if (provider) {
        provider.off("accountChanged", handleAccountChange as (...args: unknown[]) => void);
        provider.off("disconnect", handleDisconnect);
      }
    };
  }, [getProvider, fetchBalance]);

  useEffect(() => {
    if (state.publicKey) {
      const interval = setInterval(() => {
        fetchBalance(state.publicKey!);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [state.publicKey, fetchBalance]);

  const signMessage = useCallback(async (message: string): Promise<Uint8Array> => {
    const provider = getProvider();
    if (!provider) {
      throw new Error("Wallet not connected");
    }
    const encodedMessage = new TextEncoder().encode(message);
    const { signature } = await provider.signMessage(encodedMessage, "utf8");
    return signature;
  }, [getProvider]);

  return {
    ...state,
    connect,
    disconnect,
    signMessage,
    refreshBalance: () => state.publicKey && fetchBalance(state.publicKey),
  };
}
