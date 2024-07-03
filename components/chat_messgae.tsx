import React, { useEffect, useState } from "react";
import { ChatMessageContext } from "~provider/chat";
import { createUuid } from "~utils";
import { ResponseMessageType } from "~libs/bots/ibot";
import markdownit from "markdown-it";
import hljs from "highlight.js";
import { type ChatError } from "~utils/chat-errors";
import { Llama3SonarLarge32kChat } from "~libs/bots/perplexity/llama3_sonar_large_32k_chat";

// const EXTENSION_ID = chrome.runtime.id

const ChatUserMessage = (props) => {
    const { chatScrollRef } = React.useContext(ChatMessageContext);

    useEffect(() => {
        // Auto scroll to bottom
        if (chatScrollRef !== null) {
            chatScrollRef.scrollTop = chatScrollRef?.scrollHeight;
        }
    }, []);

    return (
        <div className="flex justify-end w-full">
            <div className="flex justify-end w-[80%]">
                <div className="bg-grey-300 p-2">
                    <p>{props.message}</p>
                </div>
            </div>
        </div>
    );
};

const md:any = markdownit({
    highlight: function (str: string, lang: string) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="overflow-x-auto"><code  style="background-color: #F6F8FA" class="hljs">' +
                    hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                    '</code></pre>';
            } catch (__) {/*ignore*/}
        }

        return '<pre><code style="background-color: #F6F8FA" class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
    },
    linkify: true,
    html: true,
    typographer: true
});

// const CompletionErrorView = function ({ error }: {error: ChatError}) {
//     if (error.code === ErrorCode.CAPTCHA) {
//         return <a href={EXTENSION_ID}></a>
//     }
// }

const ChatAssistantMessage = (props) => {
    const [message, setMessage] = useState("");
    const { messages, isLoading, setIsLoading } = React.useContext(ChatMessageContext);
    const [, setCompletionError] = useState<ChatError>();

    useEffect(() => {
        if (isLoading) return;

        setIsLoading(true);
        setMessage(props.placeholder || "···");
        callOpenAI();
    }, []);

    const callOpenAI = function () {
        console.log('start call openai')
        void new Llama3SonarLarge32kChat({
            globalConversationId: "1",
            parentMessageId: ""
        }).completion({
            cb: (rid, response)  => {
                console.log(response)

                if (response.message_text) {
                    setMessage(response.message_text);
                }

                if ([ResponseMessageType.DONE, ResponseMessageType.ERROR].includes(response.message_type)) {
                    setIsLoading(false)

                    if (response.error) {
                        setCompletionError(response.error)
                    }
                }
            },
            prompt: messages[messages.length - 1].content,
            rid: createUuid()
        })
    };

    return (
        <div className="flex w-full">
            <div className="w-[80%] bg-purple-50 border-amber-50">
                <div className="bg-grey-300 p-2" dangerouslySetInnerHTML={{ __html: md.render(message) }}></div>
            </div>
        </div>
    );
};

export { ChatUserMessage, ChatAssistantMessage };
