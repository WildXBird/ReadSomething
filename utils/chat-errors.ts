export enum ErrorCode {
    CONVERSATION_LIMIT = 'CONVERSATION_LIMIT',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    CAPTCHA = 'CAPTCHA',
    COPILOT_DISENGAGED = 'COPILOT_DISENGAGED',
    COPILOT_WEBSOCKET_ERROR = 'COPILOT_WEBSOCKET_ERROR',
    // 还不知道什么原因
    COPILOT_INVALID_REQUEST = 'COPILOT_INVALID_REQUEST',
    NETWORK_ERROR = 'NETWORK_ERROR',
    UNAUTHORIZED = 'UNAUTHORIZED',
    REQUEST_TIMEOUT_ABORT = 'REQUEST_TIMEOUT_ABORT',
    MODEL_INTERNAL_ERROR = 'MODEL_INTERNAL_ERROR',
    UPLOAD_FILE_NOT_SUPPORTED = 'UPLOAD_FILE_NOT_SUPPORTED',
    FILE_OTHER = 'FILE_OTHER',
    MODEL_NO_PERMISSION = 'MODEL_NO_PERMISSION',
    NEED_RESTART_FOR_TOKEN_LIMITATION = 'NEED_RESTART_FOR_TOKEN_LIMITATION',
    // CHATGPT_AUTH = 'CHATGPT_AUTH',
    // GPT4_MODEL_WAITLIST = 'GPT4_MODEL_WAITLIST',
    // COPILOT_UNAUTHORIZED = 'BING_UNAUTHORIZED',
    // API_KEY_NOT_SET = 'API_KEY_NOT_SET',
    // BARD_EMPTY_RESPONSE = 'BARD_EMPTY_RESPONSE',
    // BARD_UNAUTHORIZED = 'BARD_UNAUTHORIZED',
    // MISSING_POE_HOST_PERMISSION = 'MISSING_POE_HOST_PERMISSION',
    // POE_UNAUTHORIZED = 'POE_UNAUTHORIZED',
    // MISSING_HOST_PERMISSION = 'MISSING_HOST_PERMISSION',
    // XUNFEI_UNAUTHORIZED = 'XUNFEI_UNAUTHORIZED',
    // POE_MESSAGE_LIMIT = 'POE_MESSAGE_LIMIT',
    // LMSYS_SESSION_EXPIRED = 'LMSYS_SESSION_EXPIRED',
    // CHATGPT_INSUFFICIENT_QUOTA = 'CHATGPT_INSUFFICIENT_QUOTA',
    // CLAUDE_WEB_UNAUTHORIZED = 'CLAUDE_WEB_UNAUTHORIZED',
    // CLAUDE_WEB_UNAVAILABLE = 'CLAUDE_WEB_UNAVAILABLE',
    // QIANWEN_WEB_UNAUTHORIZED = 'QIANWEN_WEB_UNAUTHORIZED',
    // BAICHUAN_WEB_UNAUTHORIZED = 'BAICHUAN_WEB_UNAUTHORIZED',
    // LMSYS_WS_ERROR = 'LMSYS_WS_ERROR',
    // PPLX_FORBIDDEN_ERROR = 'PPLX_FORBIDDEN_ERROR',
    // TWITTER_UNAUTHORIZED = 'TWITTER_UNAUTHORIZED',
    // GROK_UNAVAILABLE = 'GROK_UNAVAILABLE',
    // CUSTOM_ERROR = 'CUSTOM_ERROR',
    // FORBIDDEN = 'FORBIDDEN',,
    OPENAI_KEY_NOT_SET = 'OPENAI_KEY_NOT_SET',
}

export class ChatError {
    code: ErrorCode;
    message: string;

    constructor (code: ErrorCode, message?: string) {
        this.message = message ?? getErrorMessage(code);
        this.code = code;
    }
}

export function getErrorMessage (errorCode: ErrorCode) {
    switch (errorCode) {
    case ErrorCode.CONVERSATION_LIMIT:
        return 'Sorry, the conversation limit has been reached. Please try later.';
    case ErrorCode.UNKNOWN_ERROR:
        return 'Sorry, something went wrong. Please restart the session.';
    case ErrorCode.CAPTCHA:
        return 'Please pass the Cloudflare check.';
    case ErrorCode.COPILOT_INVALID_REQUEST:
        return 'Please restart the Copilot session.';
    case ErrorCode.NETWORK_ERROR:
        return 'Network error.';
    case ErrorCode.REQUEST_TIMEOUT_ABORT:
        return 'Request timeout, aborted.';
    case ErrorCode.MODEL_INTERNAL_ERROR:
        return 'Some went wrong, please try again.';
    default:
        return 'Unknown error.';
    }
}
