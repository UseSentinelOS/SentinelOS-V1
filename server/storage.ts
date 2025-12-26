import {
  type User,
  type InsertUser,
  type Agent,
  type InsertAgent,
  type Transaction,
  type InsertTransaction,
  type ActivityLog,
  type InsertActivityLog,
  type ManagedWallet,
  type InsertManagedWallet,
  type WalletTransaction,
  type InsertWalletTransaction,
  type DiscoveredToken,
  type InsertDiscoveredToken,
  type WatchlistItem,
  type InsertWatchlistItem,
  users,
  agents,
  transactions,
  activityLogs,
  managedWallets,
  walletTransactions,
  discoveredTokens,
  tokenWatchlist,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  getManagedWallet(id: number): Promise<ManagedWallet | undefined>;
  getManagedWalletByUser(userId: string): Promise<ManagedWallet | undefined>;
  createManagedWallet(wallet: InsertManagedWallet): Promise<ManagedWallet>;
  updateManagedWallet(id: number, data: Partial<ManagedWallet>): Promise<ManagedWallet | undefined>;

  getWalletTransactions(walletId: number): Promise<WalletTransaction[]>;
  createWalletTransaction(tx: InsertWalletTransaction): Promise<WalletTransaction>;

  getDiscoveredTokens(limit?: number): Promise<DiscoveredToken[]>;
  getDiscoveredToken(mintAddress: string): Promise<DiscoveredToken | undefined>;
  createDiscoveredToken(token: InsertDiscoveredToken): Promise<DiscoveredToken>;
  updateDiscoveredToken(id: number, data: Partial<DiscoveredToken>): Promise<DiscoveredToken | undefined>;

  getAgents(): Promise<Agent[]>;
  getAgentsByUser(userId: string): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, data: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;

  getTransactions(agentId?: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction | undefined>;

  getActivityLogs(agentId?: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  getWatchlist(userId: string): Promise<WatchlistItem[]>;
  getWatchlistItem(id: number): Promise<WatchlistItem | undefined>;
  createWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem>;
  updateWatchlistItem(id: number, data: Partial<WatchlistItem>): Promise<WatchlistItem | undefined>;
  deleteWatchlistItem(id: number): Promise<boolean>;

  updateWalletTransaction(id: number, data: Partial<WalletTransaction>): Promise<WalletTransaction | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getManagedWallet(id: number): Promise<ManagedWallet | undefined> {
    const [wallet] = await db.select().from(managedWallets).where(eq(managedWallets.id, id));
    return wallet;
  }

  async getManagedWalletByUser(userId: string): Promise<ManagedWallet | undefined> {
    const [wallet] = await db.select().from(managedWallets).where(eq(managedWallets.userId, userId));
    return wallet;
  }

  async createManagedWallet(wallet: InsertManagedWallet): Promise<ManagedWallet> {
    const [newWallet] = await db.insert(managedWallets).values(wallet).returning();
    return newWallet;
  }

  async updateManagedWallet(id: number, data: Partial<ManagedWallet>): Promise<ManagedWallet | undefined> {
    const [updated] = await db.update(managedWallets).set({ ...data, updatedAt: new Date() }).where(eq(managedWallets.id, id)).returning();
    return updated;
  }

  async getWalletTransactions(walletId: number): Promise<WalletTransaction[]> {
    return db.select().from(walletTransactions).where(eq(walletTransactions.walletId, walletId)).orderBy(desc(walletTransactions.createdAt));
  }

  async createWalletTransaction(tx: InsertWalletTransaction): Promise<WalletTransaction> {
    const [newTx] = await db.insert(walletTransactions).values(tx).returning();
    return newTx;
  }

  async getDiscoveredTokens(limit: number = 50): Promise<DiscoveredToken[]> {
    return db.select().from(discoveredTokens).orderBy(desc(discoveredTokens.discoveredAt)).limit(limit);
  }

  async getDiscoveredToken(mintAddress: string): Promise<DiscoveredToken | undefined> {
    const [token] = await db.select().from(discoveredTokens).where(eq(discoveredTokens.mintAddress, mintAddress));
    return token;
  }

  async createDiscoveredToken(token: InsertDiscoveredToken): Promise<DiscoveredToken> {
    const [newToken] = await db.insert(discoveredTokens).values(token).returning();
    return newToken;
  }

  async updateDiscoveredToken(id: number, data: Partial<DiscoveredToken>): Promise<DiscoveredToken | undefined> {
    const [updated] = await db.update(discoveredTokens).set({ ...data, updatedAt: new Date() }).where(eq(discoveredTokens.id, id)).returning();
    return updated;
  }

  async getAgents(): Promise<Agent[]> {
    return db.select().from(agents).orderBy(desc(agents.createdAt));
  }

  async getAgentsByUser(userId: string): Promise<Agent[]> {
    return db.select().from(agents).where(eq(agents.userId, userId)).orderBy(desc(agents.createdAt));
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [newAgent] = await db.insert(agents).values(agent).returning();
    return newAgent;
  }

  async updateAgent(id: number, data: Partial<Agent>): Promise<Agent | undefined> {
    const [updated] = await db
      .update(agents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agents.id, id))
      .returning();
    return updated;
  }

  async deleteAgent(id: number): Promise<boolean> {
    const result = await db.delete(agents).where(eq(agents.id, id)).returning();
    return result.length > 0;
  }

  async getTransactions(agentId?: number): Promise<Transaction[]> {
    if (agentId) {
      return db
        .select()
        .from(transactions)
        .where(eq(transactions.agentId, agentId))
        .orderBy(desc(transactions.createdAt));
    }
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    return tx;
  }

  async createTransaction(tx: InsertTransaction): Promise<Transaction> {
    const [newTx] = await db.insert(transactions).values(tx).returning();
    return newTx;
  }

  async updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const [updated] = await db
      .update(transactions)
      .set(data)
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async getActivityLogs(agentId?: number, limit?: number): Promise<ActivityLog[]> {
    let query = db.select().from(activityLogs);
    
    if (agentId) {
      return db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.agentId, agentId))
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit || 100);
    }
    
    return db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit || 100);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  async getWatchlist(userId: string): Promise<WatchlistItem[]> {
    return db.select().from(tokenWatchlist).where(eq(tokenWatchlist.userId, userId)).orderBy(desc(tokenWatchlist.addedAt));
  }

  async getWatchlistItem(id: number): Promise<WatchlistItem | undefined> {
    const [item] = await db.select().from(tokenWatchlist).where(eq(tokenWatchlist.id, id));
    return item;
  }

  async createWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const [newItem] = await db.insert(tokenWatchlist).values(item).returning();
    return newItem;
  }

  async updateWatchlistItem(id: number, data: Partial<WatchlistItem>): Promise<WatchlistItem | undefined> {
    const [updated] = await db.update(tokenWatchlist).set(data).where(eq(tokenWatchlist.id, id)).returning();
    return updated;
  }

  async deleteWatchlistItem(id: number): Promise<boolean> {
    const result = await db.delete(tokenWatchlist).where(eq(tokenWatchlist.id, id)).returning();
    return result.length > 0;
  }

  async updateWalletTransaction(id: number, data: Partial<WalletTransaction>): Promise<WalletTransaction | undefined> {
    const [updated] = await db.update(walletTransactions).set(data).where(eq(walletTransactions.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
