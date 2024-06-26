import type { PlasmoMessaging } from "@plasmohq/messaging";
import { customChatFetch } from "~utils/custom-fetch-for-chat";
import { GEMINI_IN_PLUGIN } from "~utils/constants";
import { ChatError, ErrorCode } from "~utils/chat-errors";

const iL  = function (e: string, t: string) {
    const r = new RegExp(`"${e}":"([^"]+)"`).exec(t);

    return r == null ? void 0 : r[1];
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    console.log('start get p')

    const request = await customChatFetch(`https://gemini.google.com/?${GEMINI_IN_PLUGIN}=1`, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        responseType: "text",
    });

    if (request.error) {
        return res.send([null, request.error]);
    }

    try {
        const text = await request.response?.text();

        if (!text) {
            return res.send([null, new ChatError(ErrorCode.UNAUTHORIZED)]);
        }

        const t = iL("SNlM0e", text) ?? "";
        const n = iL("cfb2h", text) ?? "";

        if (!t || !n) {
            return res.send({
                message: [null, new ChatError(ErrorCode.UNAUTHORIZED)]
            });
        }

        return res.send([{ atValue: t, blValue: n }, null]);
    } catch (e) {
        console.log(e)

        return res.send([null, new ChatError(ErrorCode.UNAUTHORIZED)]);
    }
};

export default handler;
