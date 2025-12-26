import { Keypair, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { storage } from "./storage";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.SESSION_SECRET || "sentinel-os-secret-key-change-in-production";

export function generateNonce(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function createSignMessage(nonce: string, walletAddress: string): string {
  return `Welcome to SentinelOS!\n\nSign this message to authenticate.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
}

export function verifySignature(
  message: string,
  signature: Uint8Array,
  publicKey: string
): boolean {
  try {
    console.log("Verifying signature for wallet:", publicKey);
    console.log("Message length:", message.length);
    console.log("Signature length:", signature.length);
    const messageBytes = new TextEncoder().encode(message);
    const publicKeyBytes = new PublicKey(publicKey).toBytes();
    const result = nacl.sign.detached.verify(messageBytes, signature, publicKeyBytes);
    console.log("Verification result:", result);
    return result;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

export function encryptSecretKey(secretKey: Uint8Array): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(secretKey), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptSecretKey(encryptedData: string): Uint8Array {
  const [ivHex, encryptedHex] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return new Uint8Array(decrypted);
}

export function generateManagedWallet(): { publicKey: string; encryptedSecretKey: string } {
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toString();
  const encryptedSecretKey = encryptSecretKey(keypair.secretKey);
  return { publicKey, encryptedSecretKey };
}

export async function authenticateUser(walletAddress: string, signature: string, message: string) {
  const signatureBytes = Buffer.from(signature, "base64");
  
  const isValid = verifySignature(message, signatureBytes, walletAddress);
  if (!isValid) {
    throw new Error("Invalid signature");
  }

  let user = await storage.getUserByWallet(walletAddress);
  
  if (!user) {
    user = await storage.createUser({
      walletAddress,
      nonce: generateNonce(),
    });
    
    const { publicKey, encryptedSecretKey } = generateManagedWallet();
    await storage.createManagedWallet({
      userId: user.id,
      publicKey,
      encryptedSecretKey,
      balance: 0,
      status: "active",
    });
  } else {
    await storage.updateUser(user.id, {
      nonce: generateNonce(),
      lastLoginAt: new Date(),
    });
  }

  return user;
}
