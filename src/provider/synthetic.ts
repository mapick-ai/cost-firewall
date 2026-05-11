/**
 * Blocked response generation
 *
 * Return synthetic stream when request is blocked by Mapick
 */

export interface BlockedStreamOptions {
  provider: string;
  model: string;
  reason: string;
  format?: "openai" | "anthropic";
}

export async function* createBlockedStream(
  options: BlockedStreamOptions
): AsyncGenerator<any> {
  const { provider, model, reason, format = "openai" } = options;
  const hints: Record<string, string> = {
    emergency_stop: `🛑 Emergency stop. Use \`openclaw firewall resume\`.`,
    daily_token_limit: `⛔ Token limit reached. Use \`openclaw firewall budget reset\`.`,
    consecutive_failures: `⚠️ Consecutive failures. Use \`openclaw firewall reset ${provider}\` to clear.`,
    token_velocity: `⚡ Token velocity exceeded. Cooldown active.`,
    call_frequency: `📞 Call frequency exceeded. Cooldown active.`,
    source_cooldown: `🔥 Source in cooldown. Wait or reset.`,
  };
  const hint = hints[reason] ?? `Blocked: ${reason}`;
  const message = `Mapick Firewall — ${hint}`;

  if (format === "anthropic") {
    yield {
      type: "message_start",
      message: {
        id: `msg_mapick_${Date.now()}`,
        type: "message",
        role: "assistant",
        content: [],
        model: "mapick-blocked",
        stop_reason: "end_turn",
        usage: { input_tokens: 0, output_tokens: 0 },
      },
    };

    yield {
      type: "content_block_start",
      index: 0,
      content_block: { type: "text", text: "" },
    };

    yield {
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text: message },
    };

    yield {
      type: "content_block_stop",
      index: 0,
    };

    yield {
      type: "message_delta",
      delta: { stop_reason: "end_turn" },
      usage: { output_tokens: 0 },
    };
  } else {
    yield {
      id: `chatcmpl_mapick_${Date.now()}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: "mapick-blocked",
      choices: [
        {
          index: 0,
          delta: { role: "assistant", content: message },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }
}
