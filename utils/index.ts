export const createUuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);

        return v.toString(16);
    });
};

export const appendParamToUrl = function appendParamToUrl (url: string, paramKey: string, paramValue: any) {
    // Check if URL already has a query string
    const hasQuery = url.includes('?');

    // Use '&' if query exists, '?' if not
    const separator = hasQuery ? '&' : '?';

    // Encode the parameter value to ensure special characters do not break the URL structure
    const encodedValue = encodeURIComponent(paramValue);

    // Append and return the complete URL
    return url + separator + paramKey + '=' + encodedValue;
};

const V =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(
        ""
    );

export const getPerplexityT = function (e: number): string {
    let t = "";
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    do (t = V[e % 64] + t), (e = Math.floor(e / 64));
    while (e > 0);

    return t;
}
