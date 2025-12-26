import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/chat";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username"),
  avatarUrl: text("avatar_url"),
  nonce: text("nonce"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const userRelations = relations(users, ({ one, many }) => ({
  managedWallet: one(managedWallets),
  walletTransactions: many(walletTransactions),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const managedWallets = pgTable("managed_wallets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  publicKey: text("public_key").notNull().unique(),
  encryptedSecretKey: text("encrypted_secret_key").notNull(),
  balance: real("balance").default(0),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const managedWalletRelations = relations(managedWallets, ({ one, many }) => ({
  user: one(users, {
    fields: [managedWallets.userId],
    references: [users.id],
  }),
  transactions: many(walletTransactions),
}));

export const insertManagedWalletSchema = createInsertSchema(managedWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertManagedWallet = z.infer<typeof insertManagedWalletSchema>;
export type ManagedWallet = typeof managedWallets.$inferSelect;

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  walletId: integer("wallet_id").notNull().references(() => managedWallets.id, { onDelete: "cascade" }),
  txHash: text("tx_hash"),
  txType: text("tx_type").notNull(),
  direction: text("direction").notNull(),
  amount: real("amount").notNull(),
  tokenMint: text("token_mint"),
  tokenSymbol: text("token_symbol").default("SOL"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const walletTransactionRelations = relations(walletTransactions, ({ one }) => ({
  user: one(users, {
    fields: [walletTransactions.userId],
    references: [users.id],
  }),
  wallet: one(managedWallets, {
    fields: [walletTransactions.walletId],
    references: [managedWallets.id],
  }),
}));

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

export const discoveredTokens = pgTable("discovered_tokens", {
  id: serial("id").primaryKey(),
  mintAddress: text("mint_address").notNull().unique(),
  symbol: text("symbol"),
  name: text("name"),
  decimals: integer("decimals").default(9),
  price: real("price"),
  priceChange24h: real("price_change_24h"),
  volume24h: real("volume_24h"),
  marketCap: real("market_cap"),
  holders: integer("holders"),
  riskScore: real("risk_score"),
  source: text("source").default("axiom"),
  metadata: jsonb("metadata"),
  discoveredAt: timestamp("discovered_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertDiscoveredTokenSchema = createInsertSchema(discoveredTokens).omit({
  id: true,
  discoveredAt: true,
  updatedAt: true,
});

export type InsertDiscoveredToken = z.infer<typeof insertDiscoveredTokenSchema>;
export type DiscoveredToken = typeof discoveredTokens.$inferSelect;

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  managedWalletId: integer("managed_wallet_id").references(() => managedWallets.id),
  name: text("name").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull(),
  status: text("status").notNull().default("idle"),
  budgetLimit: real("budget_limit").default(1.0),
  currentBalance: real("current_balance").default(0),
  totalTransactions: integer("total_transactions").default(0),
  successRate: real("success_rate").default(0),
  config: jsonb("config"),
  targetTokens: text("target_tokens").array(),
  autoTradeEnabled: boolean("auto_trade_enabled").default(false),
  maxTradeAmount: real("max_trade_amount").default(0.1),
  stopLossPercent: real("stop_loss_percent").default(10),
  takeProfitPercent: real("take_profit_percent").default(20),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  isActive: boolean("is_active").default(true),
});

export const agentRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  managedWallet: one(managedWallets, {
    fields: [agents.managedWalletId],
    references: [managedWallets.id],
  }),
  transactions: many(transactions),
  activityLogs: many(activityLogs),
}));

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalTransactions: true,
  successRate: true,
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  txHash: text("tx_hash"),
  txType: text("tx_type").notNull(),
  amount: real("amount"),
  tokenSymbol: text("token_symbol").default("SOL"),
  status: text("status").notNull().default("pending"),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const transactionRelations = relations(transactions, ({ one }) => ({
  agent: one(agents, {
    fields: [transactions.agentId],
    references: [agents.id],
  }),
}));

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: text("details"),
  level: text("level").default("info"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const activityLogRelations = relations(activityLogs, ({ one }) => ({
  agent: one(agents, {
    fields: [activityLogs.agentId],
    references: [agents.id],
  }),
}));

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export const tokenWatchlist = pgTable("token_watchlist", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenMint: text("token_mint").notNull(),
  symbol: text("symbol"),
  name: text("name"),
  targetBuyPrice: real("target_buy_price"),
  targetSellPrice: real("target_sell_price"),
  autoTradeEnabled: boolean("auto_trade_enabled").default(false),
  maxBuyAmount: real("max_buy_amount").default(0.1),
  alertsEnabled: boolean("alerts_enabled").default(true),
  notes: text("notes"),
  addedAt: timestamp("added_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const watchlistRelations = relations(tokenWatchlist, ({ one }) => ({
  user: one(users, {
    fields: [tokenWatchlist.userId],
    references: [users.id],
  }),
}));

export const insertWatchlistSchema = createInsertSchema(tokenWatchlist).omit({
  id: true,
  addedAt: true,
});

export type InsertWatchlistItem = z.infer<typeof insertWatchlistSchema>;
export type WatchlistItem = typeof tokenWatchlist.$inferSelect;

export const agentTaskTypes = [
  "defi_swap",
  "yield_farming",
  "auto_dca",
  "hedging",
  "payment",
  "arbitrage",
  "monitoring",
  "token_sniper",
] as const;

export type AgentTaskType = typeof agentTaskTypes[number];

export const agentStatuses = [
  "idle",
  "running",
  "paused",
  "error",
  "completed",
] as const;

export type AgentStatus = typeof agentStatuses[number];
