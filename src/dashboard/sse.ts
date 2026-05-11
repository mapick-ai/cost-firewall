/**
 * SSE real-time push
 */

export class SseManager {
  private clients = new Set<(data: string) => void>();

  subscribe(send: (data: string) => void): () => void {
    this.clients.add(send);
    return () => this.clients.delete(send);
  }

  broadcast(data: object): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const send of this.clients) {
      try {
        send(message);
      } catch {
        this.clients.delete(send);
      }
    }
  }
}
