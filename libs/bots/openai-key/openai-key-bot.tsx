import { BotBase } from "~libs/bots/bot_base";
import {
    type BotCompletionParams,
    type BotConstructorParams,
    BotSession,
    ConversationResponse,
    type IBot, ResponseMessageType
} from "~libs/bots/ibot";
import { customChatFetch } from "~utils/custom-fetch-for-chat";
import { CountTokens } from "~utils/token";
import { SettingStorageKey } from "~provider/setting";
import { Storage } from "@plasmohq/storage";
import { ChatError, ErrorCode } from "~utils/chat-errors";

export default class OpenAIKeyBot extends BotBase implements IBot {
    botName = 'openai-api-key';
    requireLogin = false;
    session: BotSession;

    constructor (params: BotConstructorParams) {
        super(params);
        this.session = new BotSession(params.globalConversationId);
    }

    private async getApiKey () {
        const storage = new Storage()

        return await storage.get(SettingStorageKey)
    }

    private handleMessages () {
        const threshold = 4096 - 1024;

        let limitMessages = [];
        let currentLength = 0;

        const messages = this.session.messages

        for (let i = messages.length - 1; i >= 1; i--) {
            const message = messages[i];
            currentLength += CountTokens(message.text);

            if (currentLength > threshold || i === 1) {
                limitMessages = [messages[0], ...messages.slice(i)];
                break;
            }
        }

        return [...limitMessages];
    }

    async completion ({ rid, cb }: BotCompletionParams): Promise<void> {
        const openaiKey = await this.getApiKey()

        if (!openaiKey) {
            cb(rid, new ConversationResponse({
                message_type: ResponseMessageType.ERROR,
                error: new ChatError(ErrorCode.OPENAI_KEY_NOT_SET)
            }))

            return
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${openaiKey}`);

        const raw = JSON.stringify({
            "model": "gpt-3.5-turbo-0301",
            "stream": true,
            "messages": this.handleMessages()
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        // @ts-ignore
        const request = await customChatFetch("https://api.openai.com/v1/chat/completions", requestOptions)

        if (request.error) {
            cb(rid, new ConversationResponse({
                message_type: ResponseMessageType.ERROR,
                error: request.error
            }))

            return
        }

        const stream = request.response.body;
        const reader = stream.getReader();
        let chunk = "";

        function readStream () {
            reader.read().then(async ({ done, value }) => {
                if (done) {
                    return;
                }

                const enc = new TextDecoder("utf-8");
                const str = enc.decode(value.buffer);

                for (const line of str.split("\n")) {
                    let text = line.replace("data: ", "").replace("\n", "");

                    if (text !== "" && text !== "[DONE]") {
                        const payload = JSON.parse(text);
                        chunk += (payload.choices[0].delta.content || "");

                        cb(rid, new ConversationResponse({
                            message_text: chunk,
                            message_type: ResponseMessageType.GENERATING
                        }))
                    }

                    if (text === "[DONE]") {
                        cb(rid, new ConversationResponse({
                            message_text: chunk,
                            message_type: ResponseMessageType.DONE
                        }))
                    }
                }

                // read the next chunk
                readStream();
            });
        }

        readStream();

        return Promise.resolve(undefined);
    }

    getBotName ()
        :
        string {
        return this.botName;
    }

    getLoginUrl ()
        :
        string {
        return "";
    }

    getRequireLogin ()
        :
        boolean {
        return false;
    }

    startAuth ()
        :
        Promise<boolean> {
        return Promise.resolve(true);
    }

    startCaptcha ()
        :
        Promise<boolean> {
        return Promise.resolve(false);
    }
}
