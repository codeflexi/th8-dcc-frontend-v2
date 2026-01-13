// src/features/evidence/api.ts
import type { EvidenceItem } from './types';

// Mock Data: จำลองข้อมูลไว้เทสหน้า UI (Manual Search)
const MOCK_EVIDENCE_DATA: EvidenceItem[] = [
  {
    id: 'ev_001',
    docId: 'proc-2024.pdf',
    docTitle: 'Procurement Policy 2024 (v3.0)',
    page: 12,
    content: '...approval threshold for Department Managers is set at 1,000,000 THB. Any amount exceeding this must be escalated to the VP of Finance...',
    score: 0.92,
    matchType: 'EXACT',
    highlightBox: { x: 10, y: 30, w: 80, h: 8 }
  },
  {
    id: 'ev_002',
    docId: 'proc-2024.pdf',
    docTitle: 'Procurement Policy 2024 (v3.0)',
    page: 45,
    content: '...Split Purchase Orders (Split PO) to bypass approval limits are strictly prohibited and subject to disciplinary action...',
    score: 0.85,
    matchType: 'SEMANTIC',
    highlightBox: { x: 10, y: 55, w: 85, h: 6 }
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
];

export const evidenceApi = {
  // ----------------------------------------------------
  // 1. Search Evidence (Manual RAG Search)
  // ----------------------------------------------------
  async search(query: string): Promise<EvidenceItem[]> {
    console.log(`[Evidence API] Searching for: "${query}"`);

    // --- REAL API IMPLEMENTATION (Future) ---
    /*
    try {
      const response = await fetch('/api/evidence/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    } catch (e) {
      console.error(e);
      return [];
    }
    */

    // --- MOCK IMPLEMENTATION ---
    return new Promise((resolve) => {
      setTimeout(() => {
        // ถ้าไม่มี Query ให้คืนค่าทั้งหมด (Demo Purpose)
        if (!query.trim()) {
           resolve(MOCK_EVIDENCE_DATA);
           return;
        }
        
        // Filter แบบง่ายๆ
        const lowerQuery = query.toLowerCase();
        const filtered = MOCK_EVIDENCE_DATA.filter(item => 
          item.content.toLowerCase().includes(lowerQuery) ||
          item.docTitle.toLowerCase().includes(lowerQuery)
        );
        
        resolve(filtered); 
      }, 600);
    });
  },

  // ----------------------------------------------------
  // 2. Attach Evidence to Case
  // ----------------------------------------------------
  async attach(caseId: string, evidenceId: string): Promise<boolean> {
    console.log(`[Evidence API] Attaching evidence ${evidenceId} to case ${caseId}`);

    // --- REAL API IMPLEMENTATION (Future) ---
    /*
    await fetch(`/api/cases/${caseId}/evidence`, {
        method: 'POST',
        body: JSON.stringify({ evidence_id: evidenceId })
    });
    */

    // Mock Response
    return new Promise(resolve => setTimeout(() => resolve(true), 800));
  }
};