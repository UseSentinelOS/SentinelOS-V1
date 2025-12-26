import crypto from "crypto";

export interface ZKProof {
  proof: string;
  publicInputs: string[];
  verificationKey: string;
  timestamp: number;
}

export interface PrivateTransaction {
  id: string;
  commitment: string;
  nullifier: string;
  encryptedData: string;
  proof: ZKProof;
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function generateRandomBytes(length: number): string {
  return crypto.randomBytes(length).toString("hex");
}

export function generateCommitment(
  amount: number,
  recipient: string,
  secret: string
): string {
  const data = `${amount}:${recipient}:${secret}`;
  return sha256(data);
}

export function generateNullifier(
  commitment: string,
  privateKey: string
): string {
  return sha256(`${commitment}:${privateKey}`);
}

export function encryptData(
  data: object,
  publicKey: string
): string {
  const jsonData = JSON.stringify(data);
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(publicKey).digest();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  
  let encrypted = cipher.update(jsonData, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptData(
  encryptedData: string,
  privateKey: string
): object | null {
  try {
    const [ivHex, encrypted] = encryptedData.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = crypto.createHash("sha256").update(privateKey).digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

export function generateZKProof(
  statement: string,
  witness: object
): ZKProof {
  const witnessHash = sha256(JSON.stringify(witness));
  const statementHash = sha256(statement);
  
  const proofData = {
    a: generateRandomBytes(32),
    b: generateRandomBytes(64),
    c: generateRandomBytes(32),
    witnessHash,
    statementHash,
  };
  
  const proof = Buffer.from(JSON.stringify(proofData)).toString("base64");
  
  const verificationKey = sha256(`vk:${statementHash}:${Date.now()}`);
  
  return {
    proof,
    publicInputs: [statementHash],
    verificationKey,
    timestamp: Date.now(),
  };
}

export function verifyZKProof(
  proof: ZKProof,
  expectedStatement: string
): boolean {
  try {
    const proofData = JSON.parse(
      Buffer.from(proof.proof, "base64").toString("utf8")
    );
    
    const expectedHash = sha256(expectedStatement);
    
    if (proofData.statementHash !== expectedHash) {
      return false;
    }
    
    if (!proof.publicInputs.includes(expectedHash)) {
      return false;
    }
    
    const proofAge = Date.now() - proof.timestamp;
    const maxAge = 24 * 60 * 60 * 1000;
    if (proofAge > maxAge) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Proof verification failed:", error);
    return false;
  }
}

export function createPrivateTransaction(
  amount: number,
  sender: string,
  recipient: string,
  senderPrivateKey: string
): PrivateTransaction {
  const secret = generateRandomBytes(32);
  const commitment = generateCommitment(amount, recipient, secret);
  const nullifier = generateNullifier(commitment, senderPrivateKey);
  
  const transactionData = {
    amount,
    sender,
    recipient,
    secret,
    timestamp: Date.now(),
  };
  
  const encryptedData = encryptData(transactionData, recipient);
  
  const statement = `transfer:${commitment}:${nullifier}`;
  const witness = {
    amount,
    sender,
    recipient,
    secret,
    senderPrivateKey: sha256(senderPrivateKey),
  };
  
  const proof = generateZKProof(statement, witness);
  
  return {
    id: generateRandomBytes(16),
    commitment,
    nullifier,
    encryptedData,
    proof,
  };
}

export function verifyPrivateTransaction(
  transaction: PrivateTransaction
): boolean {
  const statement = `transfer:${transaction.commitment}:${transaction.nullifier}`;
  return verifyZKProof(transaction.proof, statement);
}

export interface BalanceProof {
  commitment: string;
  rangeProof: ZKProof;
  minBalance: number;
}

export function generateBalanceProof(
  actualBalance: number,
  minRequired: number,
  publicKey: string
): BalanceProof {
  const secret = generateRandomBytes(32);
  const commitment = generateCommitment(actualBalance, publicKey, secret);
  
  const statement = `balance_gte:${commitment}:${minRequired}`;
  const witness = {
    actualBalance,
    minRequired,
    secret,
    satisfies: actualBalance >= minRequired,
  };
  
  const rangeProof = generateZKProof(statement, witness);
  
  return {
    commitment,
    rangeProof,
    minBalance: minRequired,
  };
}

export function verifyBalanceProof(
  proof: BalanceProof,
  minRequired: number
): boolean {
  if (proof.minBalance !== minRequired) {
    return false;
  }
  
  const statement = `balance_gte:${proof.commitment}:${minRequired}`;
  return verifyZKProof(proof.rangeProof, statement);
}

export const ZKEngine = {
  generateCommitment,
  generateNullifier,
  encryptData,
  decryptData,
  generateZKProof,
  verifyZKProof,
  createPrivateTransaction,
  verifyPrivateTransaction,
  generateBalanceProof,
  verifyBalanceProof,
};
