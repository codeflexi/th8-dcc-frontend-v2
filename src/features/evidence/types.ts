// src/features/evidence/types.ts

export interface HighlightBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EvidenceItem {
  id: string;
  docId: string;       // ID ของเอกสาร (เช่น 'proc-2024.pdf')
  docTitle: string;    // ชื่อเอกสารที่แสดงผล
  content: string;     // ข้อความที่ Highlight
  score: number;       // คะแนนความเหมือน (0.0 - 1.0)
  
  // Optional Fields (บางที AI Stream อาจจะยังไม่ส่ง Page หรือ Box มาให้)
  page?: number;       
  matchType?: 'EXACT' | 'SEMANTIC';
  highlightBox?: HighlightBox; 
  
  // State สำหรับ Frontend
  isAttached?: boolean;
}

export interface AttachedEvidence {
  id: string;
  evidenceId: string;
  ruleId?: string;
  timestamp: string;
  status: 'LINKED';
}