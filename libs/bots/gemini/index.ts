import { sendToBackground } from "@plasmohq/messaging";
import { BotBase } from "~libs/bots/bot_base";
import GeminiSessionSingleton from "~libs/bots/gemini/gemini_session";
import {
    type BotCompletionParams,
    type BotConstructorParams,
    ConversationResponse,
    type IBot,
    ResponseMessageType
} from "~libs/bots/ibot";
import { ChatError } from "~utils/chat-errors";
import { createUuid } from "~utils";

export default class GeminiBot extends BotBase implements IBot {
    static botName = 'Gemini';
    static maxTokenLimit = 4096;
    static requireLogin = true;
    static desc = 'Suitable for text-based tasks like open-ended conversations, general text generation, code generation, and image analysis.';

    botSession: GeminiSessionSingleton;

    constructor (params: BotConstructorParams) {
        super(params);
        this.botSession = GeminiSessionSingleton.getInstance(params.globalConversationId);
    }

    async completion ({ cb, prompt, rid }: BotCompletionParams) {
        const [requestParams] = await this.botSession.getRequestParams();
        const requestBody = [null, JSON.stringify([[prompt, 0, null, []], null, this.botSession.getContextIds()])];

        const request = await sendToBackground({
            name: "gemini_stream_chat",
            body: {
                at: requestParams!.atValue,
                blValue: requestParams!.blValue,
                requestBody
            }
        })

        const [err, response] = request;

        if (err) {
            return cb(err, null);
        }

        const { text, ids } = response;
        this.botSession.setContextIds(ids);

        return cb(rid, new ConversationResponse({
            message_text: text,
            message_type: ResponseMessageType.DONE,
            conversation_id: this.botSession.getContextIds()[0],
            message_id: createUuid()
        }));
    }

    getBotName (): string {
        return GeminiBot.botName;
    }

    getLoginUrl (): string {
        return GeminiBot.loginUrl;
    }

    getMaxTokenLimit (): number {
        return GeminiBot.maxTokenLimit;
    }

    getNewModel (): boolean {
        return false;
    }

    getPaidModel (): boolean {
        return false;
    }

    getRequireLogin (): boolean {
        return GeminiBot.requireLogin;
    }

    async startAuth (): Promise<boolean> {
        await sendToBackground({
            name: "open_new_window",
            body: {
                url: GeminiBot.loginUrl,
                width: 800,
                height: 660,
                focused: true,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height
            },
        });

        return Promise.resolve(false);
    }

    async startCaptcha (): Promise<boolean> {
        await sendToBackground({
            name: "open_new_window",
            body: {
                url: GeminiBot.loginUrl,
                width: 800,
                height: 660,
                focused: true,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height
            },
        });

        return Promise.resolve(false);
    }

    static async checkIsLogin (): Promise<[ChatError | null, boolean]> {
        const [requestParams, err] = await GeminiSessionSingleton.getInstance(GeminiSessionSingleton.globalConversationId).getRequestParams();

        return [err, !!requestParams];
    }

    static async checkModelCanUse (): Promise<boolean> {
        const [requestParams] = await GeminiSessionSingleton.getInstance(GeminiSessionSingleton.globalConversationId).getRequestParams();

        return !!requestParams;
    }

}
