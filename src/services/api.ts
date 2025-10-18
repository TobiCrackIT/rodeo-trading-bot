import axios, { AxiosInstance } from "axios";

const baseUrl = process.env.API_BASE_URL || "http://localhost:3001";

const apiClient: AxiosInstance = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});


export const getTokenPrices = async (addresses: string[], network: string) => {
  const response = await apiClient.post("/api/prices/tokens", {
    addresses,
    network,
  });
  return response.data;
};

export const getSingleTokenPrice = async (address: string, network: string) => {
  const response = await apiClient.get(`/api/prices/token/${address}`, {
    params: { network },
  });
  return response.data;
};

export const getTokenPricesByNetwork = async (addresses: string[], network: string) => {
  const response = await apiClient.post(`/api/prices/tokens/${network}`, {
    addresses,
  });
  return response.data;
};

export const getComprehensiveTokenData = async (address: string, network: string) => {
  const response = await apiClient.get(`/api/prices/data/${address}`, {
    params: { network },
  });
  return response.data;
};

// Wallet API
export const getWalletInfo = async (address: string) => {
  const response = await apiClient.get(`/api/wallet/info/${address}`);
  return response.data;
};


// AI API
export const aiChat = async (prompt: string, walletData: any) => {
  const response = await apiClient.post("/api/ai/chat", {
    prompt,
    walletData,
  });
  return response.data;
};

export const processNaturalLanguageQuery = async (query: string, context: any) => {
  const response = await apiClient.post("/api/ai/query", {
    query,
    context,
  });
  return response.data;
};

export const validateQuery = async (query: string) => {
  const response = await apiClient.post("/api/ai/validate", { query });
  return response.data;
};

// General query
export const getGeneralData = async (blockchain: string, query: string) => {
  const response = await apiClient.post("/api/ai/market", {
    blockchain,
    query,
  });
  return response.data;
};

// Health Check
export const checkApiHealth = async () => {
  const response = await apiClient.get("/health");
  return response.data;
};