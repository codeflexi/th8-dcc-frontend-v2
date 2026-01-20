// src/features/copilot/api.ts

// กำหนด Type ของ Event ที่ Backend จะส่งมา
export type CopilotEventType = 'trace' | 'evidence_reveal' | 'message_chunk' | 'error';

export interface CopilotEvent {
  type: CopilotEventType;
  data: any;
}

export const copilotApi = {
  async streamChat(
    payload: { case_id: string; query: string },
    onEvent: (event: CopilotEvent) => void
  ) {
    try {
      // เรียกไปยัง Backend (ผ่าน Vite Proxy)
      const response = await fetch('/api/evidence/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.body) throw new Error("ReadableStream not supported.");

      // Logic การอ่าน Stream ทีละบรรทัด (NDJSON)
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // เก็บเศษที่ยังไม่จบบรรทัดไว้รอบหน้า

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            onEvent(event); // ส่ง Event กลับไปให้ Vue อัปเดตหน้าจอ
          } catch (err) {
            console.warn("Stream parse error:", err);
          }
        }
      }
    } catch (error) {
      console.error("Stream Error:", error);
      // ส่ง Event Error กลับไปเพื่อให้ UI แสดงผล
      onEvent({ type: 'error', data: { message: 'Connection failed' } });
      throw error;
    }
  }
};