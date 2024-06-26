import type { ChatError } from "~utils/chat-errors";

export enum ResponseMessageType {
    DONE = "done",
    GENERATING = "generating",
    TITLED = "titled",
    ERROR = "error",
    ERROR_RETRY_MESSAGE = "error_retry_message",
    ERROR_NEED_NEW_CONVERSATION = "error_need_new_conversation",
}

export interface BotConstructorParams {
    globalConversationId: string
    parentMessageId?: string
}

export class SimpleBotMessage {
    text: string;
    id: string;

    constructor (text: string, id: string) {
        this.text = text;
        this.id = id;
    }
}

export interface IBotSessionSingleton {
    botConversationId: string;
    messages: SimpleBotMessage[];

    addMessage(message: SimpleBotMessage): void;

    getBotConversationId(): string;

    setBotConversationId(conversationId: string): void;

    getParentMessageId(): string | undefined;
}
export class BotSession implements IBotSessionSingleton {
    botConversationId: string;
    globalConversationId: string;
    messages: SimpleBotMessage[] = [];

    constructor (globalConversationId: string) {
        this.globalConversationId = globalConversationId;
    }

    addMessage (message: SimpleBotMessage) {
        this.messages.push(message);
    }

    getBotConversationId () {
        return this.botConversationId;
    }

    setBotConversationId (conversationId: string) {
        this.botConversationId = conversationId;
    }

    getParentMessageId () {
        if (this.messages?.length) {
            return this.messages[this.messages.length - 1].id;
        }
    }
}

export class ConversationResponse {
    conversation_id?: string;
    message_id?: string;
    message_text?: string;
    title?: string;
    message_type: ResponseMessageType;
    error?: ChatError;
    adaptiveCards?: any;

    constructor ({ conversation_id, message_id, message_text,  message_type, title, error }: {conversation_id?: string, parent_message_id?: string, message_id?: string, message_text?: string, message_type: ResponseMessageType, title?: string, error?: ChatError}) {
        this.conversation_id = conversation_id;
        this.message_id = message_id;
        this.message_text = message_text;
        this.message_type = message_type;
        this.error = error;
        this.title = title;
    }
}
export type BotBaseCompletion = (prompt: string, rid: string, cb: ConversationResponseCb) => Promise<void>
export type ConversationResponseCb = (rid: string, m: ConversationResponse) => void;

export interface BotConstructorParams {
    globalConversationId: string
    parentMessageId?: string
}

export interface BotCompletionParams {
    prompt: string
    rid: string
    cb: ConversationResponseCb,
    forceRefresh?: boolean
}

export interface IBot {
    conversationId: string
    // return [error] if not available
    startAuth(): Promise<boolean>;
    completion(params: BotCompletionParams): Promise<void>;
    startCaptcha(): Promise<boolean>;
    getBotName(): string;
    getRequireLogin(): boolean;
    getLoginUrl(): string;
}
