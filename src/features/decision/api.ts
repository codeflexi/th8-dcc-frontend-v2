// src/features/decision/api.ts
import { http } from '@/lib/http';
import type { RuleResult, CaseFullDetail } from './types';

// Types for Backend Responses
interface BackendCaseResponse {
  id: string;
  domain?: string; // Expecting domain from backend
  vendor_id?: string;
  amount_total: number;
  status: string;
  created_at: string;
  priority_score: number;
  violations?: any[];
  raw?: {
    payload?: {
      // Procurement Fields
      vendor_name?: string;
      amount_total?: number;
      po_number?: string;
      payment_terms?: string;
      incoterm?: string;
      
      // HR Fields (Future proof)
      employee_name?: string;
      leave_request_id?: string;
      department?: string;
      leave_type?: string;
      days_count?: number;

      // Common
      description?: string;
      issue_date?: string;
      line_items?: Array<any>;
      
      // Meta
      last_decision?: string;
      risk_level?: string;
      last_rule_results?: Array<any>;
    };
    policy_id?: string;
  };
}

interface BackendRunResponse {
  status: string;
  case_id: string;
  run: {
    run_id: string;
    rule_results: Array<any>;
    recommendation: any;
    policy_id?: string;
  };
}

export const decisionApi = {
  
  async getContext(caseId: string): Promise<{ 
    caseDetail: CaseFullDetail, 
    rules: RuleResult[], 
    score: number, 
    recommendation: string 
  }> {
    try {
      const caseRes = await http.get<BackendCaseResponse>(`/api/cases/${caseId}`);
      const payload = caseRes.raw?.payload || {};
      const domain = caseRes.domain || 'PROCUREMENT'; // Default to Procurement

      const lastDecision = payload.last_decision || 'PENDING';
      const lastRisk = payload.risk_level || 'LOW';

      // --- 1. Map Rules (เหมือนเดิม) ---
      const savedRules = payload.last_rule_results || [];
      let rules: RuleResult[] = [];

      if (savedRules.length > 0) {
        rules = savedRules.map((r: any) => ({
            id: r.rule_id,
            code: r.rule_id,
            name: r.description || r.rule_id,
            description: r.description,
            status: r.hit ? 'FAIL' : 'PASS',
            hit: r.hit,
            matched: r.matched || [],
            inputs: r.inputs
        }));
      } else {
        // Mock for empty state
        rules = [
           { id: 'r1', code: 'CHECK_01', name: 'Policy Check', description: 'Checking policy compliance', status: 'PASS', hit: false, matched: [] }
        ];
      }

      // --- 2. POLYMORPHIC MAPPER (The Magic 🪄) ---
      let subject = 'Unknown';
      let refNo = '-';
      let amountVal = 0;
      let curr = 'THB';
      let attrs: { label: string; value: string }[] = [];

      if (domain === 'HR') {
          // Mapping for HR Domain
          subject = payload.employee_name || 'Unknown Staff';
          refNo = payload.leave_request_id || '-';
          amountVal = payload.days_count || 0;
          curr = 'Days';
          attrs = [
              { label: 'Department', value: payload.department || '-' },
              { label: 'Leave Type', value: payload.leave_type || '-' }
          ];
      } else {
          // Default: Procurement Mapping
          subject = payload.vendor_name || caseRes.vendor_id || 'Unknown Vendor';
          refNo = payload.po_number || '-';
          amountVal = payload.amount_total || caseRes.amount_total || 0;
          curr = 'THB';
          attrs = [
              { label: 'Payment Terms', value: payload.payment_terms || '30 Days' },
              { label: 'Incoterm', value: payload.incoterm || 'DDP' }
          ];
      }

      const caseDetail: CaseFullDetail = {
        id: caseRes.id,
        domain: domain,
        
        subjectName: subject,
        referenceNo: refNo,
        amount: amountVal,
        currency: curr,
        
        description: payload.description || 'No description provided',
        issueDate: payload.issue_date || caseRes.created_at,
        status: caseRes.status,
        riskLevel: lastRisk,
        created_at: caseRes.created_at,
        policyId: caseRes.raw?.policy_id || 'DEFAULT-POLICY',
        
        lineItems: (payload.line_items || []).map((item: any) => ({
          sku: item.sku,
          item_desc: item.item_desc,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })),
        
        attributes: attrs
      };

      return {
        caseDetail,
        rules,
        score: lastDecision === 'APPROVE' ? 98.5 : (lastDecision === 'PENDING' ? 0 : 65.0),
        recommendation: lastDecision
      };

    } catch (e) {
      console.error('Fetch Context Failed', e);
      throw e;
    }
  },

  async runDecision(caseId: string): Promise<boolean> {
    try {
      await http.post<BackendRunResponse>(
        `/api/decisions/cases/${caseId}/decisions/run`, 
        {}
      );
      return true;
    } catch (e) {
      console.error('Run Decision Failed', e);
      throw e;
    }
  },

  async submitDecision(caseId: string, action: string, reason: string) {
    console.log(`[MOCK] Submitting ${action} for ${caseId}: ${reason}`);
    return new Promise(r => setTimeout(r, 1000));
  }
};