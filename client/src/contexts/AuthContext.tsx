import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { apiRequest } from "@/lib/queryClient";

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000;
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
  }
  return btoa(chunks.join(''));
}

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: { toBase58(): string };
  isConnected?: boolean;
  signMessage(message: Uint8Array, encoding: string): Promise<{ signature: Uint8Array }>;
}

function getPhantomProvider(): PhantomProvider | null {
  if (typeof window !== "undefined" && "solana" in window) {
    const provider = (window as unknown as { solana: PhantomProvider }).solana;
    if (provider?.isPhantom) {
      return provider;
    }
  }
  return null;
}

interface User {
  id: string;
  walletAddress: string;
  username: string | null;
  avatarUrl: string | null;
}

interface ManagedWallet {
  id: number;
  publicKey: string;
  balance: number | null;
  status: string;
}

interface AuthState {
  user: User | null;
  managedWallet: ManagedWallet | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: { username?: string; avatarUrl?: string }) => Promise<void>;
  refreshManagedWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { connected, publicKey, signMessage, disconnect } = useWallet();
  const [state, setState] = useState<AuthState>({
    user: null,
    managedWallet: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = useCallback(async () => {
    // Get provider directly from window to avoid hook state sync issues
    const provider = getPhantomProvider();
    if (!provider || !provider.isConnected || !provider.publicKey) {
      throw new Error("Wallet not connected - please connect your Phantom wallet first");
    }
    
    const walletAddress = provider.publicKey.toBase58();

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      console.log("Starting login for wallet:", walletAddress);
      const nonceRes = await apiRequest("POST", "/api/auth/nonce", {
        walletAddress: walletAddress,
      });
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) {
        throw new Error(nonceData.error || "Failed to get nonce");
      }
      const { message } = nonceData;
      console.log("Got nonce message, requesting signature...");

      const encodedMessage = new TextEncoder().encode(message);
      const { signature } = await provider.signMessage(encodedMessage, "utf8");
      console.log("Got signature, verifying...");
      const signatureBase64 = uint8ArrayToBase64(signature);

      const verifyRes = await apiRequest("POST", "/api/auth/verify", {
        walletAddress: walletAddress,
        signature: signatureBase64,
        message,
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(data.error || "Authentication failed");
      }
      console.log("Login successful:", data);

      setState({
        user: data.user,
        managedWallet: data.managedWallet,
        isAuthenticated: true,
        isLoading: false,
      });

      localStorage.setItem("sentinel_wallet", walletAddress);
    } catch (error) {
      console.error("Login error:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setState({
      user: null,
      managedWallet: null,
      isAuthenticated: false,
      isLoading: false,
    });
    localStorage.removeItem("sentinel_wallet");
    disconnect();
  }, [disconnect]);

  const updateProfile = useCallback(async (data: { username?: string; avatarUrl?: string }) => {
    const provider = getPhantomProvider();
    if (!provider?.publicKey) return;
    
    const walletAddress = provider.publicKey.toBase58();

    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-wallet-address": walletAddress,
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) throw new Error("Failed to update profile");
    const updated = await res.json();
    
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updated } : null,
    }));
  }, []);

  const refreshManagedWallet = useCallback(async () => {
    const provider = getPhantomProvider();
    if (!provider?.publicKey) return;
    
    const walletAddress = provider.publicKey.toBase58();

    try {
      const res = await fetch("/api/managed-wallet", {
        headers: { "x-wallet-address": walletAddress },
      });
      if (res.ok) {
        const wallet = await res.json();
        setState(prev => ({ ...prev, managedWallet: wallet }));
      }
    } catch (error) {
      console.error("Error refreshing managed wallet:", error);
    }
  }, []);

  // Auto-restore session from localStorage + Phantom provider
  useEffect(() => {
    const checkSession = () => {
      const savedWallet = localStorage.getItem("sentinel_wallet");
      const provider = getPhantomProvider();
      
      if (savedWallet && provider?.isConnected && provider?.publicKey) {
        const currentWallet = provider.publicKey.toBase58();
        if (currentWallet === savedWallet) {
          fetch("/api/auth/me", {
            headers: { "x-wallet-address": savedWallet },
          })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                setState({
                  user: data.user,
                  managedWallet: data.managedWallet,
                  isAuthenticated: true,
                  isLoading: false,
                });
              }
            })
            .catch(console.error);
        }
      }
    };
    
    // Check immediately and also after a short delay (provider may take time to initialize)
    checkSession();
    const timeout = setTimeout(checkSession, 500);
    return () => clearTimeout(timeout);
  }, [connected]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateProfile, refreshManagedWallet }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
