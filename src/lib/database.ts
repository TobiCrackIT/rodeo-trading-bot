import { Pool } from "pg";
import { WalletData } from "../types/wallet";
import { UserSettings } from "../types/config";
import { DATABASE_URL, DB_TABLES, NATIVE_TOKEN_ADDRESS } from "../utils/constants";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Allows self-signed certificates
  },
});

// Define types for database rows
type UserRow = {
  userId: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: number;
};

type WalletRow = {
  address: string;
  userId: string;
  encryptedPrivateKey: string;
  type: string;
  createdAt: number;
};

type SettingsRow = {
  userId: string;
  slippage: number;
  gasPriority: string;
};

type TransactionRow = {
  txHash: string;
  userId: string;
  walletAddress: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string | null;
  status: string;
  gasUsed: string | null;
  timestamp: number;
};

// Initialize tables
export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${DB_TABLES.USERS} (
        userId TEXT PRIMARY KEY,
        telegramId TEXT NOT NULL,
        username TEXT,
        firstName TEXT,
        lastName TEXT,
        createdAt BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ${DB_TABLES.WALLETS} (
        address TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        encryptedPrivateKey TEXT NOT NULL,
        type TEXT NOT NULL,
        createdAt BIGINT NOT NULL,
        FOREIGN KEY (userId) REFERENCES ${DB_TABLES.USERS}(userId)
      );

      CREATE TABLE IF NOT EXISTS ${DB_TABLES.SETTINGS} (
        userId TEXT PRIMARY KEY,
        slippage REAL NOT NULL,
        gasPriority TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES ${DB_TABLES.USERS}(userId)
      );

      CREATE TABLE IF NOT EXISTS ${DB_TABLES.TRANSACTIONS} (
        txHash TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        walletAddress TEXT NOT NULL,
        fromToken TEXT NOT NULL,
        toToken TEXT NOT NULL,
        fromAmount TEXT NOT NULL,
        toAmount TEXT,
        status TEXT NOT NULL,
        gasUsed TEXT,
        timestamp BIGINT NOT NULL,
        FOREIGN KEY (userId) REFERENCES ${DB_TABLES.USERS}(userId),
        FOREIGN KEY (walletAddress) REFERENCES ${DB_TABLES.WALLETS}(address)
      );
    `);
  } finally {
    client.release();
  }
}

// User operations
export async function createUser(
  userId: string,
  telegramId: string,
  username?: string,
  firstName?: string,
  lastName?: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO ${DB_TABLES.USERS} (userId, telegramId, username, firstName, lastName, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (userId) DO NOTHING`,
      [userId, telegramId, username, firstName, lastName, Date.now()]
    );
  } finally {
    client.release();
  }
}

// Ensure the user exists before saving the wallet
export async function ensureUserExists(userId: string, telegramId: string): Promise<void> {
  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await createUser(userId, telegramId); // Create the user if they don't exist
  }
}

export async function getUserByTelegramId(telegramId: string): Promise<UserRow | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM ${DB_TABLES.USERS} WHERE telegramId = $1`,
      [telegramId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Wallet operations
export async function saveWallet(walletData: WalletData, userId: string): Promise<void> {
  const client = await pool.connect();
  try {
    
    await client.query(
      `INSERT INTO ${DB_TABLES.WALLETS} (address, userId, encryptedPrivateKey, type, createdAt)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (address) DO UPDATE SET
       userId = $2, encryptedPrivateKey = $3, type = $4, createdAt = $5`,
      [
        walletData.address,
        userId,
        walletData.encryptedPrivateKey,
        walletData.type,
        walletData.createdAt,
      ]
    );
  } finally {
    client.release();
  }
}

export async function getWalletByUserId(userId: string): Promise<WalletData | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT address, userId, encryptedPrivateKey AS "encryptedPrivateKey", type, createdAt AS "createdAt"
       FROM ${DB_TABLES.WALLETS} WHERE userId = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function getWalletByAddress(address: string): Promise<WalletData | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT address, userId, encryptedPrivateKey AS "encryptedPrivateKey", type, createdAt AS "createdAt" FROM ${DB_TABLES.WALLETS} WHERE address = $1`,
      [address]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function deleteWallet(address: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `DELETE FROM ${DB_TABLES.WALLETS} WHERE address = $1`,
      [address]
    );
  } finally {
    client.release();
  }
}

// Settings operations
export async function saveUserSettings(
  userId: string,
  settings: Omit<UserSettings, "userId">
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO ${DB_TABLES.SETTINGS} (userId, slippage, gasPriority)
       VALUES ($1, $2, $3)
       ON CONFLICT (userId) DO UPDATE SET
       slippage = $2, gasPriority = $3`,
      [userId, settings.slippage, settings.gasPriority]
    );
  } finally {
    client.release();
  }
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM ${DB_TABLES.SETTINGS} WHERE userId = $1`,
      [userId]
    );
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      userId,
      slippage: row.slippage,
      gasPriority: row.gasPriority,
    };
  } finally {
    client.release();
  }
}

// Transaction operations
export async function saveTransaction(
  txHash: string,
  userId: string,
  walletAddress: string,
  fromToken: string,
  toToken: string,
  fromAmount: string,
  status: string,
  toAmount?: string,
  gasUsed?: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO ${DB_TABLES.TRANSACTIONS} (
        txHash, userId, walletAddress, fromToken, toToken, 
        fromAmount, toAmount, status, gasUsed, timestamp
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (txHash) DO NOTHING`,
      [
        txHash,
        userId,
        walletAddress,
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        status,
        gasUsed,
        Date.now(),
      ]
    );
  } finally {
    client.release();
  }
}

export async function getTransactionsByUserId(
  userId: string,
  limit = 10
): Promise<TransactionRow[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM ${DB_TABLES.TRANSACTIONS} 
       WHERE userId = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getUniqueTokensByUserId(userId: string): Promise<string[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT DISTINCT LOWER(token) as token FROM (
         SELECT fromToken AS token FROM ${DB_TABLES.TRANSACTIONS}
         WHERE userId = $1 AND LOWER(fromToken) != LOWER($2)
         UNION
         SELECT toToken AS token FROM ${DB_TABLES.TRANSACTIONS}
         WHERE userId = $1 AND LOWER(toToken) != LOWER($2)
       ) AS tokens
       ORDER BY token`,
      [userId, NATIVE_TOKEN_ADDRESS]
    );
    return result.rows.map((row) => row.token);
  } finally {
    client.release();
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    console.log("✅ Database connection pool closed.");
  } catch (error) {
    console.error("❌ Error closing database connection pool:", error);
  }
}
