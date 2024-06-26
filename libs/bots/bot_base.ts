import type { BotConstructorParams } from "~libs/bots/ibot";
import type { ChatError } from "~utils/chat-errors";

export abstract class BotBase {
    static botName = 'BotBase';
    static loginUrl = '';
    static requireLogin = true;
    static desc = "";
    static maxTokenLimit = 2048;
    conversationId: BotConstructorParams['globalConversationId'];
    parentMessageId: BotConstructorParams['parentMessageId'];

    // 可能会被前端连续调用，可以优化
    static checkIsLogin (): Promise<[ChatError | null, boolean]> {
        return Promise.resolve([null, false]);
    }

    static checkModelCanUse (): Promise<boolean> {
        return Promise.resolve(true);
    }

    protected constructor (params: BotConstructorParams) {
        this.conversationId = params.globalConversationId;
        this.parentMessageId = params.parentMessageId;
    }
}
