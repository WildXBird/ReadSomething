import type { PlasmoMessaging } from "@plasmohq/messaging";
import { customChatFetch } from "~utils/custom-fetch-for-chat";
import { getPerplexityT } from "~utils";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const checkSidRequest = await customChatFetch(
        `https://www.perplexity.ai/socket.io/?EIO=4&transport=polling&sid=${req.body.sid}&t=${getPerplexityT(+new Date())}&--ppp=1`,
        {
            body: `40${JSON.stringify({ jwt: "anonymous-ask-user" })}`,
            method: "POST",
            credentials: "include"
        }
    );

    if (checkSidRequest.error) {
        return res.send([checkSidRequest.error]);
    }

    return res.send([null])
};

export default handler;
