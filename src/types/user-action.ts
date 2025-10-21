export interface UserActionParameters {
    token_symbol?: string;
    amount?: string;
    recipient?: string;
    network?: string;
    contract_address?: string;
    method?: string;
    extra?: Record<string, any>;
}

export interface UserAction {
    intent: string;
    parameters: UserActionParameters;
    confidence: number;
    missing_info: string[];
    userInput: string;
    timestamp: string;
}