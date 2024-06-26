import { ChatError, ErrorCode } from "~utils/chat-errors";

export const CHAT_FETCH_TIMEOUT = 20 * 1000;
export class ChatFetchResponse {
    response?: Response;
    error?: ChatError;

    constructor (response?: Response, error?: ChatError) {
        this.response = response;
        this.error = error;
    }
}

function handleHttpStatus (response: Response): ChatFetchResponse {
    const chatResponse = new ChatFetchResponse();

    const status = response.status;

    chatResponse.response = response;

    if (status < 200 || status >= 300) {
        if (status === 403) {
            chatResponse.error = new ChatError(ErrorCode.CAPTCHA);
        }
        else if (status === 401) chatResponse.error = new ChatError(ErrorCode.UNAUTHORIZED);
        else if (status === 429) chatResponse.error = new ChatError(ErrorCode.CONVERSATION_LIMIT);
        else chatResponse.error = new ChatError(ErrorCode.UNKNOWN_ERROR);
    }

    return chatResponse;
}

export async function customChatFetch (url: string, options?: RequestInit, timeout: number = CHAT_FETCH_TIMEOUT): Promise<ChatFetchResponse> {
    const controller = new AbortController();
    const signal = controller.signal;

    // 设置超时定时器
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { ...options, signal });
        // 清除超时定时器
        clearTimeout(timeoutId);

        return handleHttpStatus(response);
    } catch (error) {
        // 清除超时定时器
        clearTimeout(timeoutId);
        const r = new ChatFetchResponse();

        // 处理网络错误或请求被中断的情况
        if (error.name === 'AbortError') {
            r.error = new ChatError(ErrorCode.REQUEST_TIMEOUT_ABORT);
        } else {
            r.error = new ChatError(ErrorCode.NETWORK_ERROR);
        }

        return r;
    }
}
