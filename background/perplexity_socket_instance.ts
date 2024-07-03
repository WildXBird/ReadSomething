import WebSocketAsPromised from "websocket-as-promised";
import { type BotCompletionParams, ConversationResponse, ResponseMessageType } from "~libs/bots/ibot";
import { createUuid } from "~utils";
import { ChatError, ErrorCode } from "~utils/chat-errors";

class Message {
    content: string;
    role: "user" | "assistant";
    priority: number;

    constructor (content: string, role: "user" | "assistant", priority: number) {
        this.content = content;
        this.role = role;
        this.priority = priority;
    }
}

class PerplexitySocketInstance {
    private seq = 1;
    private msgCallback: BotCompletionParams['cb']
    private rid: BotCompletionParams['rid']
    private ws: WebSocketAsPromised;
    private sid: string
    private prompt: string
    private messages: Message[] = [];
    private model: string

    private separateNumberAndObject (input: string) {
        const regex = /^(\d+)(.*)/;
        const match = input.match(regex);

        if (match) {
            const number = parseInt(match[1]);

            try {
                const object = JSON.parse(match[2]);

                return { number, object };
            } catch (error) {
                return { number, object: match[2] };
            }
        } else {
            return { object: input };
        }
    }

    private addMessage (message: Message) {
        this.messages.push(message);
    }

    private sendMessage () {
        this.addMessage(new Message(this.prompt, "user", 0));

        const ask = [
            "perplexity_labs",
            {
                "version": "2.9",
                "source": "default",
                "model": this.model,
                "messages": this.messages,
                // timezone: "Asia/Shanghai"
            }
        ];

        this.ws.sendPacked(ask);
    }

    async completion ({ prompt, rid, cb }: BotCompletionParams, sid: string, model: string) {
        this.prompt = prompt
        this.rid = rid
        this.msgCallback = cb
        this.model = model

        if (sid === this.sid && this.ws) {
            return
        }

        this.sid = sid
        void this.ws?.close()
        this.ws = null

        const wsp = new WebSocketAsPromised(
            `wss://www.perplexity.ai/socket.io/?EIO=4&transport=websocket&sid=${this.sid}`,
            {
                packMessage: (data) => {
                    return `42${this.seq++}${JSON.stringify(data)}`;
                },
                unpackMessage: (data) => {
                    return this.separateNumberAndObject(data as string);
                },
            }
        );

        wsp.onOpen.addListener(() => {
            wsp.send("2probe");
        });

        wsp.onMessage.addListener(function () {
            // Logger.log("PerplexityBot onMessage", data)
        });

        wsp.onSend.addListener(function () {
            // Logger.log("PerplexityBot onSend", data)
        });

        wsp.onUnpackedMessage.addListener(async (data) => {
            if (!data) {
                return;
            }

            try {
                // Logger.log("data number", data.number, data)
                switch (Number(data.number)) {
                case 2:
                    wsp.send("3");
                    break;
                case 3:
                    if (data.object === "probe") {
                        wsp.send("5");
                        this.sendMessage();
                    }

                    break;
                case 42:
                    if (data?.object?.length >= 2) {
                        const result = data.object[1];

                        try {
                            const response = result.output;

                            if (response) {
                                this.msgCallback(this.rid, new ConversationResponse(
                                    {
                                        conversation_id: this.sid,
                                        message_text: response,
                                        message_type: ResponseMessageType.GENERATING,
                                    }
                                ));
                            }
                        } catch (error) {
                            this.msgCallback(this.rid, new ConversationResponse(
                                {
                                    conversation_id: this.sid,
                                    message_type: ResponseMessageType.ERROR,
                                    message_id: createUuid(),
                                    error: new ChatError(ErrorCode.UNKNOWN_ERROR)
                                }
                            ));
                        }
                    }

                    break;
                default:
                    if (String(data.number).toString().startsWith("43")) {
                        if (data?.object?.length >= 1) {
                            const result = data.object[0];

                            try {
                                if (result.status === "failed") {
                                    this.msgCallback(this.rid, new ConversationResponse({
                                        conversation_id: this.sid,
                                        message_type: ResponseMessageType.ERROR,
                                        message_id: createUuid(),
                                        error: new ChatError(ErrorCode.MODEL_INTERNAL_ERROR, result.text)
                                    }));

                                    return;
                                }

                                this.addMessage(new Message(result.output, "assistant", 0));

                                const text = result.output;

                                if (text) {
                                    this.msgCallback(this.rid, new ConversationResponse(
                                        {
                                            conversation_id: this.sid,
                                            message_text: text,
                                            message_id: createUuid(),
                                            message_type: ResponseMessageType.DONE,
                                        }
                                    ));
                                }
                            } catch (error) {
                                this.msgCallback(this.rid, new ConversationResponse(
                                    {
                                        conversation_id: this.sid,
                                        message_type: ResponseMessageType.ERROR,
                                        error: new ChatError(ErrorCode.UNKNOWN_ERROR)
                                    }
                                ));
                            }
                        }
                    }

                    break;
                }
            } catch (error) {
                this.msgCallback(this.rid, new ConversationResponse(
                    {
                        conversation_id: this.sid,
                        message_type: ResponseMessageType.ERROR,
                        error: new ChatError(ErrorCode.UNKNOWN_ERROR)
                    }
                ));
            }
        });

        wsp.onError.addListener(() => {
            wsp.removeAllListeners();
            void wsp.close();
            this.msgCallback(this.rid, new ConversationResponse(
                {
                    conversation_id: this.sid,
                    message_type: ResponseMessageType.ERROR,
                    error: new ChatError(ErrorCode.COPILOT_WEBSOCKET_ERROR)
                }
            ));
            // reject(event);
        });

        wsp.onClose.addListener(() => {
        });

        void wsp.open();

        this.ws = wsp;
    }

}

export default new PerplexitySocketInstance()
