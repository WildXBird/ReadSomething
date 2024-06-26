import { PERPLEXITY_SOCKET_PORT_NAME } from "~utils/constants";
import PerplexitySocketInstance from "~background/perplexity_socket_instance";

chrome.runtime.onConnect.addListener(function (port) {
    console.assert(port.name === PERPLEXITY_SOCKET_PORT_NAME);
    port.onMessage.addListener(function (msg) {
        const { prompt, rid, sid } = msg;
        void PerplexitySocketInstance.completion({
            prompt,
            rid,
            cb: (data) => {
                port.postMessage(data)
            }
        }, sid, prompt)
    });
});
