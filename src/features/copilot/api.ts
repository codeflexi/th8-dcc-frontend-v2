// src/features/copilot/api.ts
import { http } from '@/lib/http'; // ใช้ wrapper เดิมสำหรับงานทั่วไป (ถ้ามี)

// -----------------------------
// 1. Interfaces & Types
// -----------------------------

// สิ่งที่ส่งไป Backend
export interface ChatRequest {
  case_id: string;
  query: string;
  history?: Array<{ role: 'user' | 'agent'; content: string }>; // เผื่อส่ง history ไปด้วย
}

// โครงสร้าง Event ที่ได้รับกลับมา (จาก backend python)
export type CopilotEventType = 'trace' | 'message_chunk' | 'evidence_reveal' | 'error';

export interface CopilotEvent {
  type: CopilotEventType;
  data: any; // หรือจะเจาะจง type ย่อยก็ได้ เช่น TraceData, ChunkData
}

// Interfaces สำหรับ UI นำไปใช้ต่อ
export interface TraceStep {
  step_id: number;
  title: string;
  status: 'pending' | 'active' | 'completed';
  desc: string;
  relatedFileId?: string;
}

export interface EvidenceData {
  file_id: string;
  file_name: string;
  highlight_text: string;
  page?: number;
}

// Callback function type สำหรับส่งข้อมูลกลับไปหน้า Vue ทีละท่อน
type StreamCallback = (event: CopilotEvent) => void;

// -----------------------------
// 2. API Implementation
// -----------------------------

export const copilotApi = {
  
  /**
   * ฟังก์ชันคุยกับ Chat Agent แบบ Streaming
   * ซ่อน logic fetch / reader / decoder ไว้ที่นี่ หน้าบ้านจะได้คลีนๆ
   */
  async streamChat(payload: ChatRequest, onEvent: StreamCallback): Promise<void> {
    try {
      // ⚠️ หมายเหตุ: การทำ Streaming มักต้องใช้ fetch โดยตรงแทน wrapper (เช่น axios) 
      // เพื่อเข้าถึง ReadableStream ได้
      const response = await fetch('/api/copilot/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // ถ้ามี auth
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Copilot API Error: ${response.statusText}`);
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // Backend อาจส่งมาหลายบรรทัดใน chunk เดียว ต้อง split
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            const event: CopilotEvent = JSON.parse(line);
            onEvent(event); // ส่ง event กลับไปให้ Vue component
          } catch (err) {
            console.warn('Error parsing JSON chunk:', line);
          }
        }
      }
    } catch (error) {
      console.error('Stream Chat Failed:', error);
      // ส่ง error event กลับไปให้ UI รู้
      onEvent({ type: 'error', data: { message: 'Connection lost' } });
      throw error;
    }
  },

  /**
   * ตัวอย่างฟังก์ชันปกติ (ไม่ stream) เช่น ดึงประวัติเก่า
   */
  async getHistory(caseId: string) {
    return http.get(`/api/copilot/history/${caseId}`);
  }
};