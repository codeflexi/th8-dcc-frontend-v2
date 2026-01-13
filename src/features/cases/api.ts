// src/features/cases/api.ts
import { http } from '@/lib/http';
import type { CaseDTO, RiskLevel } from '@/types/case';

// -----------------------------
// 1. เพิ่ม Type ย่อยสำหรับ Story
// -----------------------------
export interface CaseStory {
  headline: string;
  risk_drivers: Array<{
    label: string;
    detail: string;
    color: string;
  }>;
  business_impact: string[];
  suggested_action: {
    title: string;
    description: string;
  };
  evidence_list: Array<{
    title: string;
    subtitle: string;
    description: string;
    source_code: string;
  }>;
}

//

// -----------------------------
// Backend Interfaces
// -----------------------------
interface BackendCaseItem {
  id: string;
  vendor_id: string;
  amount_total: number;
  status: string;
  created_at: string;
  priority_score?: number;
  domain?: string;

  vendor_name?: string;
  vendor?: string;

  risk_level?: string;

  payload?: {
    risk_level?: string;
  };
}

interface BackendCaseDetail extends BackendCaseItem {
  decision_summary?: {
    risk_level?: string;
    recommended_action?: string;
    decided_at?: string;
  };

  violations?: Array<{
    rule_name: string;
    severity: string;
  }>;
  // ✅✅✅ เพิ่มบรรทัดนี้ครับ !!!
  story?: CaseStory;
}

// -----------------------------
// Helpers
// -----------------------------
const normalizeRiskLevel = (val?: string): RiskLevel => {
  if (val === 'LOW' || val === 'MEDIUM' || val === 'HIGH' || val === 'CRITICAL') {
    return val;
  }
  return 'LOW';
};

// -----------------------------
// API
// -----------------------------
export const caseApi = {
  async getAll(): Promise<CaseDTO[]> {
    try {
      const items = await http.get<BackendCaseItem[]>('/api/cases');

      if (items.length > 0) {
        console.log('Sample Case from Backend:', items[0]);
      }

      return items.map(item => ({
        id: item.id,
        vendor: item.vendor_id || item.vendor_name || item.vendor || 'Unknown Vendor',
        amount: item.amount_total,
        currency: 'THB',
        status: item.status as any,

        // // 🎯 canonical + type-safe
        // risk_level: normalizeRiskLevel(
        //   item.risk_level ||
        //   item.payload?.risk_level
        // ),
        // 🎯 canonical + type-safe
        risk_level: normalizeRiskLevel(
          item.risk_level 
        ),

        created_at: item.created_at,
        priority_score: item.priority_score || 0,
        domain: item.domain || 'procurement'
      }));
    } catch (e) {
      console.warn('API Failed, using empty list');
      return [];
    }
  },

  async getById(id: string): Promise<BackendCaseDetail> {
    return http.get<BackendCaseDetail>(`/api/cases/${id}`);
  },

  async ingest(data: { case_id: string; domain: string; payload: any }): Promise<boolean> {
    try {
      await http.post('/api/cases/ingest', {
        case_id: data.case_id,
        domain: data.domain || 'procurement',
        payload: data.payload,
        story: data.payload.story || null // ส่ง story ถ้ามี
      });
      return true;
    } catch (e) {
      console.error('Ingest API Failed', e);
      throw e;
    }
  }
};
