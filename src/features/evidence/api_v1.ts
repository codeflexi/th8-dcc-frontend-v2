// src/features/evidence/api.ts
import type { EvidenceItem } from './types';

export const evidenceApi = {
  // จำลองการ Search (RAG)
  async search(query: string): Promise<EvidenceItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'ev_001',
            docId: 'proc-2024.pdf',
            docTitle: 'Procurement Policy 2024 (v3.0)',
            page: 12,
            content: '...approval threshold for Department Managers is set at 1,000,000 THB. Any amount exceeding this must be escalated to the VP of Finance...',
            score: 0.92,
            matchType: 'EXACT',
            highlightBox: { x: 10, y: 30, w: 80, h: 8 } // Highlight กลางหน้า
          },
          {
            id: 'ev_002',
            docId: 'proc-2024.pdf',
            docTitle: 'Procurement Policy 2024 (v3.0)',
            page: 45,
            content: '...Split Purchase Orders (Split PO) to bypass approval limits are strictly prohibited and subject to disciplinary action...',
            score: 0.85,
            matchType: 'SEMANTIC',
            highlightBox: { x: 10, y: 55, w: 85, h: 6 } // Highlight ค่อนไปทางล่าง
          },
          {
            id: 'ev_003',
            docId: 'sla-appendix.pdf',
            docTitle: 'Vendor SLA Appendix B',
            page: 3,
            content: '...Vendor performance score below 80% for two consecutive quarters triggers an automatic review...',
            score: 0.65,
            matchType: 'SEMANTIC',
            highlightBox: { x: 15, y: 20, w: 70, h: 10 }
          }
        ]);
      }, 600);
    });
  },

  // จำลองการ Attach หลักฐาน
  async attach(caseId: string, evidenceId: string): Promise<boolean> {
    console.log(`[API] Attaching evidence ${evidenceId} to case ${caseId}`);
    return new Promise(resolve => setTimeout(() => resolve(true), 800));
  }
};