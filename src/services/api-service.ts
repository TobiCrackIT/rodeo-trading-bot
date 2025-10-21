import { TokenData } from "../types/wallet";
import { UserAction } from "../types/user-action";
import { getComprehensiveTokenData, getGeneralData, extractIntent } from "./api";
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

export async function fetchGeneralData(query: string): Promise<any> {
    try {
        const data = await getGeneralData(NETWORK, query);
        return data;
    } catch (error) {
        console.error("❌ Error fetching general data:", error);
        return null;
    }
}

export async function extractUserIntent(userInput: string): Promise<UserAction | null> {
    try {
        const intentData = await extractIntent(userInput);
        return intentData as UserAction;
    } catch (error) {
        console.error("❌ Error extracting user intent:", error);
        return null;
    }
}