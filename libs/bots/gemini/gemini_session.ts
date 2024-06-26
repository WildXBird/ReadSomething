import { ChatError } from "~utils/chat-errors";
import { BotSession } from "~libs/bots/ibot";
import { sendToBackground } from "@plasmohq/messaging";

class GeminiRequestParams {
    blValue: string;
    atValue: string;

    constructor () {
        this.blValue = "";
        this.atValue = "";
    }
}
export default class GeminiSessionSingleton {
    private static instance: GeminiSessionSingleton | null;
    private requestParams: GeminiRequestParams;
    static globalConversationId: string;
    private static contextIds: string[] = ["", "", ""];
    session: BotSession;

    private constructor () {
        this.session = new BotSession(GeminiSessionSingleton.globalConversationId);
    }

    static destroy () {
        GeminiSessionSingleton.globalConversationId = "";
        GeminiSessionSingleton.instance = null;
        GeminiSessionSingleton.contextIds = ["", "", ""];
    }

    static getInstance (globalConversationId: string) {
        if (globalConversationId !== GeminiSessionSingleton.globalConversationId) {
            GeminiSessionSingleton.destroy();
        }

        GeminiSessionSingleton.globalConversationId = globalConversationId;

        if (!GeminiSessionSingleton.instance) {
            GeminiSessionSingleton.instance = new GeminiSessionSingleton();
        }

        return GeminiSessionSingleton.instance;
    }

    setContextIds (ids: string[]) {
        GeminiSessionSingleton.contextIds = ids;
    }

    getContextIds () {
        return GeminiSessionSingleton.contextIds;
    }

    private async _getRequestParams (): Promise<[GeminiRequestParams | null, ChatError | null]> {
        return sendToBackground({
            name: "gemini_get_request_params",
        })
    }

    async getRequestParams (): Promise<[GeminiRequestParams | null, ChatError | null]> {
        if (this.requestParams) {
            return [this.requestParams, null];
        }

        return this._getRequestParams();
    }
}
