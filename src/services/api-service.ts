import { TokenData } from "../types/wallet";
import { getComprehensiveTokenData, getGeneralData } from "./api";
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

export async function fetchGeneralData(blockchain: string, query: string): Promise<any> {
    try {
        const data = await getGeneralData(blockchain, query);
        return data;
    } catch (error) {
        console.error("❌ Error fetching general data:", error);
        return null;
    }
}