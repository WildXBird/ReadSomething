import {
    type BotCompletionParams,
    type BotConstructorParams,
    ConversationResponse,
    type ConversationResponseCb, type IBot,
    ResponseMessageType
} from "~libs/bots/ibot";
import WebSocketAsPromised from "websocket-as-promised";
import { customChatFetch } from "~utils/custom-fetch-for-chat";
import { ChatError, ErrorCode } from "~utils/chat-errors";
import { appendParamToUrl, createUuid } from "~utils";
import { sendToBackground } from "@plasmohq/messaging";
import { BotBase } from "~libs/bots/bot_base";
import {
    IS_OPEN_IN_CHAT_AUTH_WINDOW, MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS, WINDOW_FOR_REMOVE_STORAGE_KEY
} from "~utils/constants";
import { getPort } from "@plasmohq/messaging/port"

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

export class PerplexitySession {
    private model: string;

    constructor (model: string) {
        this.model = model;
    }

    private seq = 1;
    private ws: WebSocketAsPromised;
    private msgCallback: ConversationResponseCb;
    private rid: string;
    private prompt: string;
    private sid: string;
    private messages: Message[] = [];
    private socketPort: chrome.runtime.Port

    static destroy () {
        // if(PerplexitySession?.ws?.isOpened) {
        //     void PerplexitySession?.ws?.close();
        //     PerplexitySession.ws = null;
        // }
        // PerplexitySession.instance = null;
    }

    get wsClosed () {
        return this.ws?.isClosed;
    }

    wsClose () {
        return this.ws?.close();
    }

    private V =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(
            ""
        );

    private Z (e: number): string {
        let t = "";
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        do (t = this.V[e % 64] + t), (e = Math.floor(e / 64));
        while (e > 0);

        return t;
    }

    private get t () {
        return this.Z(+new Date());
    }

    async checkAvailability (): Promise<[ChatError | null]> {
        const request = await customChatFetch(
            "https://www.perplexity.ai/api/auth/session"
        );

        if (request.error) {
            return [request.error];
        }

        try {
            const result = await request?.response?.text();

            if (result === "{}") {
                return [new ChatError(ErrorCode.UNAUTHORIZED)];
            }

            return [null];
        } catch (e) {
            return [new ChatError(ErrorCode.UNKNOWN_ERROR)];
        }
    }

    async completion (prompt: string, rid: string, cb: ConversationResponseCb): Promise<void> {
        this.prompt = prompt;
        this.rid = rid;
        this.msgCallback = cb;

        // await sendToBackground({
        //     name: "fix-partition-cookie",
        //     body: {
        //         domain: "perplexity.ai",
        //         url: "https://www.perplexity.ai"
        //     },
        // });

        // 说明是一个新的会话
        if (!this.ws) {
            // const [err] = await this.checkAvailability();
            //
            // if (err) {
            //     this.msgCallback(this.rid, new ConversationResponse(
            //         {
            //             conversation_id: this.sid,
            //             message_type: ResponseMessageType.ERROR,
            //             error: err
            //         }
            //     ));
            //
            //     return;
            // }

            await this.startSession();
        } else {
            this.sendMessage();
        }
    }

    private async someRequest () {
        const myHeaders = new Headers();

        await customChatFetch(`https://www.perplexity.ai/socket.io/?EIO=4&transport=polling&t=${this.t}&sid=${this.sid}`, {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        });
    }

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

    private async startSession () {
        const [text, error] = await sendToBackground({
            name: "perplexity_socket_1_request"
        })

        if (error) {
            this.msgCallback(this.rid, new ConversationResponse({
                conversation_id: this.sid,
                message_type: ResponseMessageType.ERROR,
                error
            }));

            return
        }

        const result = this.separateNumberAndObject(text);
        this.sid = result.object.sid;

        const [sidError] = await sendToBackground({
            name: "perplexity_check_sid",
            body: {
                sid: this.sid
            }
        })

        if (sidError) {
            this.msgCallback(this.rid, new ConversationResponse({
                conversation_id: this.sid,
                message_type: ResponseMessageType.ERROR,
                error: sidError
            }));

            return;
        }

        this.createWs();
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

    private onMessageCallback = ({ rid, data }: { rid: string, data: ConversationResponse }) => {
        if ([ResponseMessageType.ERROR, ResponseMessageType.DONE].includes(data.message_type)) {
            this.socketPort?.onMessage.removeListener(this.onMessageCallback)
            // this.socketPort.disconnect()
        }

        console.log(this)

        this.msgCallback(rid as string, data as ConversationResponse)
    }

    private createWs (): void {
        this.socketPort = getPort("perplexity")

        this.socketPort.onMessage.addListener(this.onMessageCallback);

        this.socketPort.postMessage({
            body: {
                prompt: this.prompt,
                sid: this.sid,
                rid: this.rid,
                model: this.model,
            }
        })

        // this.sid = "3pv0EzwUQ7vAgEMcAHLw"
        // const wsp = new WebSocketAsPromised(
        //     `wss://www.perplexity.ai/socket.io/?EIO=4&transport=websocket&sid=${this.sid}`,
        //     {
        //         packMessage: (data) => {
        //             return `42${this.seq++}${JSON.stringify(data)}`;
        //         },
        //         unpackMessage: (data) => {
        //             return this.separateNumberAndObject(data as string);
        //         },
        //     }
        // );
        //
        // wsp.onOpen.addListener(() => {
        //     wsp.send("2probe");
        // });
        //
        // wsp.onMessage.addListener(function () {
        //     // Logger.log("PerplexityBot onMessage", data)
        // });
        //
        // wsp.onSend.addListener(function () {
        //     // Logger.log("PerplexityBot onSend", data)
        // });
        //
        // wsp.onUnpackedMessage.addListener(async (data) => {
        //     if (!data) {
        //         return;
        //     }
        //
        //     try {
        //         // Logger.log("data number", data.number, data)
        //         switch (Number(data.number)) {
        //         case 2:
        //             wsp.send("3");
        //             break;
        //         case 3:
        //             if (data.object === "probe") {
        //                 wsp.send("5");
        //                 this.sendMessage();
        //             }
        //
        //             break;
        //         case 42:
        //             if (data?.object?.length >= 2) {
        //                 const result = data.object[1];
        //
        //                 try {
        //                     const response = result.output;
        //
        //                     if (response) {
        //                         this.msgCallback(this.rid, new ConversationResponse(
        //                             {
        //                                 conversation_id: this.sid,
        //                                 message_text: response,
        //                                 message_type: ResponseMessageType.GENERATING,
        //                             }
        //                         ));
        //                     }
        //                 } catch (error) {
        //                     this.msgCallback(this.rid, new ConversationResponse(
        //                         {
        //                             conversation_id: this.sid,
        //                             message_type: ResponseMessageType.ERROR,
        //                             message_id: createUuid(),
        //                             error: new ChatError(ErrorCode.UNKNOWN_ERROR)
        //                         }
        //                     ));
        //                 }
        //             }
        //
        //             break;
        //         default:
        //             if (String(data.number).toString().startsWith("43")) {
        //                 if (data?.object?.length >= 1) {
        //                     const result = data.object[0];
        //
        //                     try {
        //                         if (result.status === "failed") {
        //                             this.msgCallback(this.rid, new ConversationResponse({
        //                                 conversation_id: this.sid,
        //                                 message_type: ResponseMessageType.ERROR,
        //                                 message_id: createUuid(),
        //                                 error: new ChatError(ErrorCode.MODEL_INTERNAL_ERROR, result.text)
        //                             }));
        //
        //                             return;
        //                         }
        //
        //                         this.addMessage(new Message(result.output, "assistant", 0));
        //
        //                         const text = result.output;
        //
        //                         if (text) {
        //                             this.msgCallback(this.rid, new ConversationResponse(
        //                                 {
        //                                     conversation_id: this.sid,
        //                                     message_text: text,
        //                                     message_id: createUuid(),
        //                                     message_type: ResponseMessageType.DONE,
        //                                 }
        //                             ));
        //                         }
        //                     } catch (error) {
        //                         this.msgCallback(this.rid, new ConversationResponse(
        //                             {
        //                                 conversation_id: this.sid,
        //                                 message_type: ResponseMessageType.ERROR,
        //                                 error: new ChatError(ErrorCode.UNKNOWN_ERROR)
        //                             }
        //                         ));
        //                     }
        //                 }
        //             }
        //
        //             break;
        //         }
        //     } catch (error) {
        //         this.msgCallback(this.rid, new ConversationResponse(
        //             {
        //                 conversation_id: this.sid,
        //                 message_type: ResponseMessageType.ERROR,
        //                 error: new ChatError(ErrorCode.UNKNOWN_ERROR)
        //             }
        //         ));
        //     }
        // });
        //
        // wsp.onError.addListener(() => {
        //     wsp.removeAllListeners();
        //     void wsp.close();
        //     this.msgCallback(this.rid, new ConversationResponse(
        //         {
        //             conversation_id: this.sid,
        //             message_type: ResponseMessageType.ERROR,
        //             error: new ChatError(ErrorCode.COPILOT_WEBSOCKET_ERROR)
        //         }
        //     ));
        //     // reject(event);
        // });
        //
        // wsp.onClose.addListener(() => {
        // });
        //
        // void wsp.open();
        //
        // this.ws = wsp;
    }
}

export class PerplexitySessionSingleton {
    static model = "";
    private static sessionInstance: PerplexitySession | null;
    static globalConversationId: string;

    protected constructor () {
        // ignore
    }

    static getInstance (params: BotConstructorParams, model: string): PerplexitySession {
        PerplexitySessionSingleton.model = model;

        if (PerplexitySessionSingleton?.sessionInstance?.wsClosed) {
            PerplexitySessionSingleton.destroy();
        }

        if (this.globalConversationId !== params.globalConversationId) {
            PerplexitySessionSingleton.destroy();
        }

        if (!PerplexitySessionSingleton.sessionInstance) {
            PerplexitySessionSingleton.sessionInstance = new PerplexitySession(PerplexitySessionSingleton.model);
        }

        this.globalConversationId = params.globalConversationId;

        return PerplexitySessionSingleton.sessionInstance;
    }

    static destroy () {
        void PerplexitySessionSingleton?.sessionInstance?.wsClose();
        PerplexitySessionSingleton.sessionInstance = null;
    }
}

export abstract class PerplexityBot extends BotBase implements IBot {
    static botName = 'Perplexity';
    static loginUrl = 'https://perplexity.ai/';
    static AUTH_WINDOW_KEY = 'perplexity_auth_window';
    static CAPTCHA_WINDOW_KEY = 'perplexity_captcha_window';
    static isLogin: boolean | null = null;
    static maxTokenLimit = 0;
    static paidModel = false;
    static requireLogin = false;

    protected perplexitySession: PerplexitySession;
    model: string;

    protected constructor (params: BotConstructorParams) {
        super(params);
    }

    async completion ({ prompt, rid, cb }: BotCompletionParams): Promise<void> {
        void this.perplexitySession.completion(prompt, rid, cb);
    }

    static async checkIsLogin (): Promise<[ChatError | null, boolean]> {
        const request = await customChatFetch(
            "https://www.perplexity.ai/api/auth/session"
        );

        if (request.error) {
            return [request.error, false];
        }

        this.isLogin = await request.response?.text() !== "{}";

        return [null, true];
    }

    static async checkModelCanUse (): Promise<boolean> {
        if (this.isLogin == null) {
            const [, isLogin] = await this.checkIsLogin();

            return isLogin;
        }

        return Promise.resolve(this.isLogin);
    }

    async startAuth (): Promise<boolean> {
        const randomKey = '__window_key_' + Math.random() * 1000;
        const perplexityAuthValue = createUuid();

        const url = appendParamToUrl(appendParamToUrl(
            appendParamToUrl(PerplexityBot.loginUrl, IS_OPEN_IN_CHAT_AUTH_WINDOW, '1'),
            WINDOW_FOR_REMOVE_STORAGE_KEY, randomKey
        ), PerplexityBot.AUTH_WINDOW_KEY, perplexityAuthValue);

        const res = await sendToBackground({
            name: "open_new_window",
            body: {
                url,
                width: 800,
                height: 660,
                focused: true,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height
            },
        });

        const storage = new Storage();
        await storage.set(randomKey, res);

        return new Promise((resolve) => {
            const listener = function (message: any) {
                if (message.action === MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS) {
                    if (message.authKey === perplexityAuthValue) {
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(true);
                    }
                }
            };

            chrome.runtime.onMessage.addListener(listener);
        });
    }

    async startCaptcha (): Promise<boolean> {
        // const randomKey = '__window_key_' + Math.random() * 1000;
        // const perplexityCaptchaValue = createUuid();
        //
        // const url =
        //     appendParamToUrl(
        //         appendParamToUrl(
        //             appendParamToUrl(
        //                 appendParamToUrl(
        //                     appendParamToUrl(PerplexityBot.loginUrl, IS_OPEN_IN_CHAT_CAPTCHA_WINDOW, '1'),
        //                     WINDOW_FOR_REMOVE_STORAGE_KEY, randomKey
        //                 ), PerplexityBot.CAPTCHA_WINDOW_KEY, perplexityCaptchaValue), R_SCP_PARAM, "1"), IS_OPEN_IN_PLUGIN, "1");
        //
        // const frame = new XFramePerplexityChat(url);
        // frame.render();
        //
        // return new Promise((resolve) => {
        //     const listener = function (message: any) {
        //         if (message.action === MESSAGE_ACTION_CHAT_PROVIDER_CAPTCHA_SUCCESS) {
        //
        //             if (message.authKey === perplexityCaptchaValue) {
        //                 chrome.runtime.onMessage.removeListener(listener);
        //                 frame.destroy();
        //                 resolve(true);
        //             }
        //         }
        //     };
        //
        //     chrome.runtime.onMessage.addListener(listener);
        // });

        return true
    }

    supportedUploadTypes = [];

    getBotName (): string {
        return PerplexityBot.botName;
    }

    getLoginUrl (): string {
        return PerplexityBot.loginUrl;
    }

    getRequireLogin (): boolean {
        return PerplexityBot.requireLogin;
    }

    getMaxTokenLimit (): number {
        return PerplexityBot.maxTokenLimit;
    }

    getPaidModel (): boolean {
        return PerplexityBot.paidModel;
    }
}
