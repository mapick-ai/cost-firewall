/**
 * Anthropic Messages API upstream transport
 */
export async function* streamAnthropic(options) {
    const { apiKey, model, messages, max_tokens = 4096, stream = true, ...rest } = options;
    const url = "https://api.anthropic.com/v1/messages";
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens,
            stream,
            ...rest,
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic upstream error ${response.status}: ${errorText}`);
    }
    if (!response.body) {
        throw new Error("Anthropic upstream returned empty body");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data: "))
                    continue;
                const data = trimmed.slice("data: ".length);
                try {
                    yield JSON.parse(data);
                }
                catch {
                    // 跳过无效 JSON
                }
            }
        }
    }
    finally {
        reader.releaseLock();
    }
}
//# sourceMappingURL=anthropic.js.map