// src/features/evidence/api.ts
import type { EvidenceItem } from './types';

// เพิ่มข้อมูล Mock สำหรับสัญญาเพื่อให้ระบบหาเจอเมื่อทำ Auto Search
const MOCK_EVIDENCE_DATA: EvidenceItem[] = [
  {
    id: 'ev_contract_001',
    docId: 'CTR-2026-001.pdf',
    docTitle: 'Master Agreement: IT Equipment (CTR-2026-001)',
    page: 5,
    content: '...Item 1.1: MacBook Pro 14-inch (M3 Pro). The agreed Unit Price for this contract period is set at 72,000 THB net...',
    score: 0.98,
    matchType: 'EXACT',
    highlightBox: { x: 10, y: 42, w: 80, h: 5 }
  },
  {
    id: 'ev_001',
    docId: 'proc-2024.pdf',
    docTitle: 'Procurement Policy 2024 (v3.0)',
    page: 12,
    content: '...approval threshold for Department Managers is set at 1,000,000 THB...',
    score: 0.92,
    matchType: 'EXACT',
    highlightBox: { x: 10, y: 30, w: 80, h: 8 }
  },
  // ... (ข้อมูลอื่นๆ เหมือนเดิม)
];

export const evidenceApi = {
  /**
   * 1. Search Evidence (ปรับปรุงให้รองรับ Contextual Query)
   */
  async search(query: string, context?: { vendor?: string; sku?: string }): Promise<EvidenceItem[]> {
    console.log(`[Evidence API] Searching for: "${query}"`);

    // --- MOCK IMPLEMENTATION ---
    return new Promise((resolve) => {
      setTimeout(() => {
        let finalQuery = query.toLowerCase();

        // ✅ ถ้ามี Context เรื่องราคา ให้ลำดับความสำคัญของสัญญาก่อน
        const isPriceSearch = finalQuery.includes('ราคา') || finalQuery.includes('price');
        
        const filtered = MOCK_EVIDENCE_DATA.filter(item => {
          const contentMatch = item.content.toLowerCase().includes(finalQuery);
          const titleMatch = item.docTitle.toLowerCase().includes(finalQuery);
          
          // ถ้าเป็น Auto Search เรื่องราคา ให้เจาะจงที่ไฟล์ที่มีคำว่า "Agreement" หรือ "Contract"
          if (isPriceSearch && (item.docTitle.includes('Agreement') || item.docTitle.includes('Contract'))) {
            return true;
          }
          
          return contentMatch || titleMatch;
        });

        // เรียงลำดับตาม Score (สัญญาที่ตรงเป้าควรอยู่บนสุด)
        const sorted = filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        resolve(sorted); 
      }, 600);
    });
  },

  /**
   * 2. Attach Evidence to Case
   */
  async attach(caseId: string, evidenceId: string): Promise<boolean> {
    console.log(`[Evidence API] Attaching evidence ${evidenceId} to case ${caseId}`);
    return new Promise(resolve => setTimeout(() => resolve(true), 800));
  }
};