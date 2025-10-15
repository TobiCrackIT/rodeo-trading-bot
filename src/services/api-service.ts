import { TokenData } from "../types/wallet";
import { getComprehensiveTokenData } from "./api";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const NETWORK = process.env.NETWORK || "base"; // Default to "base" if NETWORK is not set

export async function fetchComprehensiveTokenData(address: string): Promise<TokenData | null> {
    try {
        const tokenData = await getComprehensiveTokenData(address, NETWORK);
        return tokenData as TokenData;
    } catch (error) {
        console.error("❌ Error fetching comprehensive token data:", error);
        return null;
    }
}