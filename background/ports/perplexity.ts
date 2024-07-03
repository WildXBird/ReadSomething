import type { PlasmoMessaging } from "@plasmohq/messaging"
import PerplexitySocketInstance from "~background/perplexity_socket_instance";

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
    const { prompt, rid, sid, model } = req.body;

    void PerplexitySocketInstance.completion({
        prompt,
        rid,
        cb: (rid, data) => {
            console.log('ccccc', data)
            res.send({
                rid,
                data
            })
        }
    }, sid, model)
}

export default handler
