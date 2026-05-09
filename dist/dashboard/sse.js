/**
 * SSE 实时推送
 */
export class SseManager {
    clients = new Set();
    subscribe(send) {
        this.clients.add(send);
        return () => this.clients.delete(send);
    }
    broadcast(data) {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        for (const send of this.clients) {
            try {
                send(message);
            }
            catch {
                this.clients.delete(send);
            }
        }
    }
}
//# sourceMappingURL=sse.js.map