// src/features/decision/types.ts

export type RuleStatus = 'PASS' | 'FAIL' | 'WARNING';

export interface RuleMatch {
  field: string;
  operator: string;
  expected: any;
  actual: any;
}

export interface RuleResult {
  id: string;
  code: string; 
  name: string; 
  description?: string;
  status: RuleStatus;
  hit: boolean;
  matched: RuleMatch[]; 
  inputs?: Record<string, any>;
}

export interface LineItem {
  sku: string;
  item_desc: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ✅ Generic Attribute for extra info
export interface CaseAttribute {
  label: string;
  value: string;
}

// ✅ Polymorphic Case Detail (Flexible)
export interface CaseFullDetail {
  id: string;
  domain: string; // 'PROCUREMENT' | 'HR' | ...
  
  // Generic Fields
  subjectName: string;   // Vendor / Employee Name
  referenceNo: string;   // PO No / Request ID
  amount: number;        // Total Amount / Days
  currency: string;      // THB / Days
  
  description: string;
  issueDate: string;
  status: string;
  riskLevel: string;
  created_at: string;
  policyId?: string;
  
  // Flexible Data
  lineItems: LineItem[]; 
  attributes: CaseAttribute[]; // Extra details specific to domain
}

export interface DecisionState {
  caseId: string;
  caseDetail?: CaseFullDetail;
  recommendation: 'APPROVE' | 'REJECT' | 'MANUAL_REVIEW';
  confidenceScore: number;
  rules: RuleResult[];
  userDecision?: 'APPROVED' | 'REJECTED';
  reason?: string;
  isProcessing: boolean;
  error?: string;
}