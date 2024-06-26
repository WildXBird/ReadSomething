import type { PlasmoMessaging } from "@plasmohq/messaging";
import { customChatFetch } from "~utils/custom-fetch-for-chat";
import { GEMINI_IN_PLUGIN } from "~utils/constants";
import { ChatError, ErrorCode } from "~utils/chat-errors";

const lJe = function () {
    return Math.floor(Math.random() * 9e5) + 1e5;
}

const parseResponse = function (e: string) {
    const t = JSON.parse(e.split(`\n`)[3])
        , n = JSON.parse(t[0][2]);

    if (!n) {
        throw new Error();
    }

    let r = n[4][0][1][0];
    const i = n[4][0][4] || [];

    for (const o of i)
        try {
            const a = o[0][4]
                , s = o[0][0][0]
                , l = o[1][0][0]
                , c = o[o.length - 1][0];
            r = r.replace(c, `[![${a}](${s})](${l})`);
        } catch {
            // ignore
        }

    return {
        text: r,
        ids: [...n[1], n[4][0][0]]
    };
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const r = await customChatFetch(`https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=${req.body!.blValue}&rt=c&_reqid=${lJe()}&${GEMINI_IN_PLUGIN}=1`, {
        method: "POST",
        body: new URLSearchParams({
            at: req.body.at,
            "f.req": JSON.stringify(req.body.requestBody)
        }),
    });

    if (r.error) {
        return res.send([r.error, null])
    }

    try {
        const s = await r.response?.text();
        const responseData = parseResponse(s!);

        return res.send([null, responseData])
    } catch (e) {
        return res.send([new ChatError(ErrorCode.UNKNOWN_ERROR), null])
    }
};

export default handler;
