// -----------------------------
// Types
// -----------------------------
export interface ChatRequest {
  query: string
}

/**
 * Backend-native event types (do NOT rename)
 */
export type CopilotEventType =
  | 'trace'
  | 'message_chunk'
  | 'evidence_reveal'
  | 'final'
  | 'error'

export interface CopilotEvent {
  type: CopilotEventType
  data: any
}

type StreamCallback = (event: CopilotEvent) => void

// -----------------------------
// API
// -----------------------------
export const copilotApi = {
  async streamChat(
    payload: ChatRequest,
    onEvent: StreamCallback
  ): Promise<void> {
    const response = await fetch('/api/copilot/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: payload.query
      })
    })

    if (!response.ok || !response.body) {
      onEvent({
        type: 'error',
        data: { message: 'Connection failed' }
      })
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // NDJSON = newline-delimited JSON
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const evt = JSON.parse(line)

            // Expect backend format:
            // { type: 'trace' | 'message_chunk' | 'evidence_reveal' | 'final', data: {...} }
            if (!evt.type) continue

            onEvent({
              type: evt.type,
              data: evt.data
            })
          } catch (err) {
            console.warn('[Copilot] Invalid NDJSON line:', line)
          }
        }
      }
    } catch (err) {
      onEvent({
        type: 'error',
        data: { message: 'Stream interrupted' }
      })
    }
  }
}
