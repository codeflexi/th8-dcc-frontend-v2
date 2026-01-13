// src/features/evidence/types.ts

// src/features/evidence/types.ts

export interface HighlightBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EvidenceItem {
  id: string;
  docId: string;
  docTitle: string;
  page: number;
  content: string;
  score: number; // คะแนนความเหมือน (0.0 - 1.0)
  matchType: 'EXACT' | 'SEMANTIC';
  highlightBox?: HighlightBox; // พิกัดสำหรับทำ Highlight บน PDF (Optional)
  
  // Optional fields (เผื่อไว้สำหรับ state หน้าบ้าน)
  isAttached?: boolean;
}

export interface AttachedEvidence {
  id: string;
  evidenceId: string;
  ruleId?: string;
  timestamp: string;
  status: 'LINKED';
}