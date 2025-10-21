import { InlineKeyboard } from "grammy";
import { BotContext } from "../context";
import { extractUserIntent, fetchComprehensiveTokenData, fetchGeneralData } from "../services/api-service";

export async function handleGreeting(ctx: BotContext): Promise<void> {
    try {
        const keyboard = new InlineKeyboard()
            .text("💰 Balance", "check_balance")
            .text("💱 Buy/Sell", "buy_token")
            .row()
            .text("📥 Deposit", "deposit")
            .text("📤 Withdraw", "withdraw");

        await ctx.reply(
            "🤖 Hello! Welcome to Rodeo, the number 1 vibe-trading platform on Base. Here are some things you can do:\n\n" +
            "/wallet - View your wallet\n" +
            "/balance - Check your balances\n" +
            "/buy - Buy tokens with ETH\n" +
            "/sell - Sell tokens for ETH\n" +
            "/deposit - Get your deposit address\n" +
            "/withdraw - Withdraw ETH to another address\n" +
            "/settings - Change trading settings\n" +
            "/help - Show this help message",
            { reply_markup: keyboard }
        );
    } catch (error) {
        await ctx.reply("❌ An error occurred. Please try again later.");
    }
}

export async function handleContractAddress(ctx: BotContext): Promise<void> {
    try {

        const tokenAddress = ctx.message?.text?.trim();

        if (!tokenAddress) {
            await ctx.reply("❌ Invalid request. Please try again.");
            return;
        }

        var tokenData = await fetchComprehensiveTokenData(tokenAddress);
        if (tokenData) {
            await ctx.reply(
                `🔍 *Token Information:*\n\n` +
                `*Name:* ${tokenData.name}\n` +
                `*Symbol:* $${tokenData.symbol}\n` +
                `*Address:* ${tokenData.address}\n` +
                //`*Network:* ${tokenData.network}\n` +
                `*Price (USD):* $${tokenData.price_usd}`,
                { parse_mode: "Markdown" }
            );
        } else {
            await ctx.reply("❌ Unable to fetch token data. Please ensure the address is correct.");
        }
    } catch (error) {
        await ctx.reply("❌ Unable to fetch token data. Please ensure the address is correct.");
    }
}

export async function handleUserIntent(ctx: BotContext): Promise<void> {
    try {
        const text = ctx.message?.text?.trim() ?? '';

        var chat = await ctx.reply("💡 Thinking...");

        var response = await extractUserIntent(text);

        await ctx.api.editMessageText(chat.chat.id, chat.message_id,
            '⏳ Processing instruction...'
        );

        if (response == null) {
            await ctx.api.editMessageText(chat.chat.id, chat.message_id,
                "❌ Unable to fetch data for your query. Please try rephrasing."
            );
        }

        console.log("General Data Response:", response);
        if (response!.intent != 'other') {
            await ctx.api.editMessageText(chat.chat.id, chat.message_id,
                `${response!.intent}`,
                { parse_mode: "HTML" }
            );
        } else if (response!.intent == 'other') {
            var r = await fetchGeneralData(text);
            console.log("General Data Response:", r);
            await ctx.api.editMessageText(chat.chat.id, chat.message_id,
                `${r.response}`
            );
        } else {
            await ctx.reply("❌ Unable to fetch data for your query. Please try rephrasing.");
        }

    } catch (error) {
        await ctx.reply("❌ Unable to fetch token data. Please ensure the address is correct.");
    }
}