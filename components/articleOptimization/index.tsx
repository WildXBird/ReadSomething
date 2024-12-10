type Article = {
    title: string;
    content: string;
    textContent: string;
    length: number;
    excerpt: string;
    byline: string;
    dir: string;
    siteName: string;
    lang: string;
    publishedTime: string;
}
export const articleOptimization = (article: Article) => {
    console.log("articleOptimization", article)
    article.content = addLinkAttributeToAnchors(article.content)
    return article
}

function addLinkAttributeToAnchors(htmlString) {
    {
        globalThis.linkHandle = function (e) {
            console.log("linkHandle", e)
        }
    }
    // 创建一个新的DOM解析器
    const parser = new DOMParser();
    // 解析HTML字符串
    const doc = parser.parseFromString(htmlString, 'text/html');

    // 创建一个TreeWalker来遍历所有的a标签
    const treeWalker = document.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_ELEMENT,
        //   {
        //     acceptNode: function(node) {
        //       // 如果节点是a标签，则接受它
        //       return node.tagName.toLowerCase() === 'a' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        //     }
        //   },
        //   false
    );

    // 遍历所有的a标签
    let currentNode = treeWalker.nextNode();
    while (currentNode) {
        if (currentNode instanceof HTMLElement) {
            switch (currentNode.tagName) {
                case "A":
                    {
                        //修改默认的链接行为
                        const href = currentNode.getAttribute('href');
                        currentNode.setAttribute('link', href);
                        currentNode.setAttribute("onclick", `linkHandle("${encodeURIComponent(href)}")`);
                        currentNode.removeAttribute('href');
                    }
                    break;

                default:
                    break;
            }
        }

        currentNode = treeWalker.nextNode();
    }

    // 将修改后的DOM转换回HTML字符串
    const serializer = new XMLSerializer();
    const newHtmlString = serializer.serializeToString(doc.body);

    // 输出修改后的HTML字符串
    return newHtmlString;
}


