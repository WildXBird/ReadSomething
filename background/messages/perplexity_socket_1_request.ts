import type { PlasmoMessaging } from "@plasmohq/messaging";
import { customChatFetch } from "~utils/custom-fetch-for-chat";
import { ChatError, ErrorCode } from "~utils/chat-errors";
import { getPerplexityT } from "~utils";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const myHeaders = new Headers();

    const request = await customChatFetch(`https://www.perplexity.ai/socket.io/?transport=polling&EIO=4&t=${getPerplexityT(+new Date())}&--ppp=1`, {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
        credentials: "include"
    });

    if (request.error) {
        return res.send([null, request.error])
    }

    const text = await request?.response?.text();

    if (!text) {
        return res.send([null, new ChatError(ErrorCode.UNKNOWN_ERROR)]);
    }

    return res.send([text, null])
};

export default handler;
