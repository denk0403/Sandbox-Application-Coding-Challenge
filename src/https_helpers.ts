import https from "https";

/**
 * Performs a GET request.
 * @param url The request URL
 */
export function get(url: string): Promise<string> {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (dataBuffer: Buffer) => {
                chunks.push(dataBuffer);
            }).on("end", () => {
                const data: Buffer = Buffer.concat(chunks);
                resolve(data.toString());
            });
        });
    });
}

/**
 * Performs a POST request with the given body.
 * @param url The request URL
 * @param body The request body
 */
export function post(url: string, body: string): Promise<string> {
    return new Promise((resolve) => {
        https
            .request(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": body.length,
                },
            })
            .on("response", (res) => {
                const chunks: Buffer[] = [];
                res.on("data", (dataBuffer: Buffer) => {
                    chunks.push(dataBuffer);
                }).on("end", () => {
                    const data: Buffer = Buffer.concat(chunks);
                    resolve(data.toString());
                });
            })
            .end(body);
    });
}
