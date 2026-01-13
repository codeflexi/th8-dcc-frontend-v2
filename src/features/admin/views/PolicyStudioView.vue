<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// --- MOCK DATA ---
const files = [
  { id: 'f1', name: 'procurement-policy-v1.yaml', type: 'yaml', status: 'modified' },
  { id: 'f2', name: 'vendor-scoring-weights.yaml', type: 'yaml', status: 'clean' },
  { id: 'f3', name: 'approval-matrix-2026.json', type: 'json', status: 'clean' },
  { id: 'f4', name: 'rag-knowledge-config.yaml', type: 'yaml', status: 'clean' },
];

const defaultYaml = `# TH8 Procurement Policy Definition
# Last Updated: 2026-01-10 by Admin
# Version: 3.1.0-draft

policy_id: PROCUREMENT-001
policy_name: Procurement Exception Control
version: v3.1
effective_date: 2026-01-01

# ==========================================
# System Configuration
# ==========================================
config:
  high_risk_threshold: 200000   # ถ้ายอดเกินนี้ บังคับเป็น HIGH Risk ทันที
  force_risk_level: HIGH

scope:
  decision_type: PROCUREMENT
  applies_to:
    - raw_material
    - packaging
    - indirect

# ==========================================
# Risk Thresholds (amount-based safety net)
# ==========================================
thresholds:
  amount:
    medium: 200000
    high: 500000

sla:
  approval_due_hours: 24

# ==========================================
# Authority Matrix
# ==========================================
authority:
  rules:
    - condition: amount > 1000000
      required_role: CFO
    - condition: amount > 200000
      required_role: COO
    - condition: amount <= 200000
      required_role: Procurement_Manager

# ==========================================
# Contract Configuration
# ==========================================
contract_compliance:
  validity_check: true        # ตรวจวันหมดอายุ
  price_check: true           # ตรวจราคา
  max_allowed_variance_pct: 5.0  # ยอมให้ราคาเกินสัญญาได้ไม่เกิน 5% (ถ้าเกินถือว่าผิดกฎ)

# ==========================================
# Decision Rules
# ==========================================
rules:

  # -------------------------------------------------
  # 1. High Amount Control
  # -------------------------------------------------
  - id: HIGH_AMOUNT_ESCALATION
    description: "High value procurement (>200k) must be escalated"
    risk_impact: HIGH
    when:
      - field: amount
        operator: ">"
        value: 200000
    then:
      decision: ESCALATE

  # -------------------------------------------------
  # 2. SLA Risk
  # -------------------------------------------------
  - id: SLA_RISK
    description: "Urgent procurement (close to SLA deadline)"
    risk_impact: MEDIUM
    when:
      - field: hours_to_sla
        operator: "<"
        value: 24
    then:
      decision: REVIEW

  # -------------------------------------------------
  # 3. Vendor Risk
  # -------------------------------------------------
  - id: VENDOR_BLACKLIST_CHECK
    description: "Critical: Vendor is flagged as BLACKLISTED"
    risk_impact: CRITICAL
    when:
      - field: vendor_status
        operator: "=="
        value: "BLACKLISTED"
    then:
      decision: REJECT

  - id: VENDOR_RATING_LOW
    description: "Warning: Vendor performance rating is below standard (Score < 60)"
    risk_impact: MEDIUM
    when:
      - field: vendor_rating
        operator: "<"
        value: 60
    then:
      decision: REVIEW

  # -------------------------------------------------
  # 4. Budget Control
  # -------------------------------------------------
  - id: BUDGET_INSUFFICIENT
    description: "Purchase amount exceeds remaining department budget"
    risk_impact: CRITICAL
    when:
      - field: budget_remaining
        operator: "<"
        value: 0
    then:
      decision: REJECT

  # -------------------------------------------------
  # 5. Fraud Risk — Split PO
  # -------------------------------------------------
  - id: POTENTIAL_SPLIT_PO
    description: "Fraud Risk: Potential Split PO detected (Multiple orders < 24h)"
    risk_impact: HIGH
    when:
      - field: po_count_24h
        operator: ">"
        value: 1
      - field: total_spend_24h
        operator: ">"
        value: 100000
    then:
      decision: ESCALATE

  # -------------------------------------------------
  # 6. AI Semantic Risk
  # -------------------------------------------------
  - id: VENDOR_CATEGORY_MISMATCH
    type: llm_semantic_check
    description: "Check if items match vendor business category"
    risk_impact: MEDIUM
    inputs:
      - vendor_name
      - line_items
    then:
      decision: REVIEW
  # -------------------------------------------------
  # 7. Contract Validity (NEW ✅)
  # -------------------------------------------------
  - id: CONTRACT_EXPIRED
    description: "Purchase order referencing an expired contract"
    risk_impact: CRITICAL
    # Logic นี้ซับซ้อน จะถูก handle โดย EvaluateContractNode
    # แต่เราประกาศไว้ตรงนี้เพื่อให้ Engine รู้จัก Action
    then:
      decision: REJECT

  # -------------------------------------------------
  # 8. Price Variance (NEW ✅)
  # -------------------------------------------------
  - id: CONTRACT_PRICE_VARIANCE
    description: "Unit price exceeds contract agreement (> 5%)"
    risk_impact: HIGH
    then:
      decision: ESCALATE

  # -------------------------------------------------
  # 9. No Contract Found (NEW ✅)
  # -------------------------------------------------
  - id: NO_CONTRACT_REFERENCE
    description: "Item purchased without active contract reference"
    risk_impact: MEDIUM
    then:
      decision: REVIEW
      
# ==========================================
# Override & Governance
# ==========================================
override:
  allow_manual_override: true
  override_requires_reason: true

# ==========================================
# Audit Policy
# ==========================================
audit:
  log_level: INFO
  retention_days: 90


`;

// --- STATE ---
const activeFile = ref(files[0].id);
const codeContent = ref(defaultYaml);
const isSimulating = ref(false);
const simulationResult = ref<null | 'PASS' | 'FAIL'>(null);
const consoleLogs = ref<string[]>([]);

// --- ACTIONS ---
const activeFileName = computed(() => files.find(f => f.id === activeFile.value)?.name);

function runSimulation() {
  isSimulating.value = true;
  simulationResult.value = null;
  consoleLogs.value = ['> Initializing Rule Engine v2.1...', '> Loading Context: CASE-P0-OVT-2025-007...'];
  
  setTimeout(() => {
    consoleLogs.value.push('> Parsing YAML configuration...');
    consoleLogs.value.push('> Validating schema... OK');
    consoleLogs.value.push(`> Rule SPLIT_PO_CHECK: Executing with threshold 1,000,000...`);
    
    // Logic Mock: ถ้าแก้ตัวเลขใน Editor เป็นค่าอื่น อาจจะเปลี่ยนผลลัพธ์ (Simulated)
    if (codeContent.value.includes('threshold_amount: 5000000')) {
         consoleLogs.value.push('> Result: PASS (Amount 3.2M < Threshold 5.0M)');
         simulationResult.value = 'PASS';
    } else {
         consoleLogs.value.push('> Result: FAIL (Amount 3.2M > Threshold 1.0M)');
         consoleLogs.value.push('> Violation detected: Split PO Risk');
         simulationResult.value = 'FAIL';
    }
    
    isSimulating.value = false;
  }, 1200);
}

function savePolicy() {
  alert('Policy saved to Git Repository (v3.2.1)');
}
</script>

<template>
   <div class="h-full flex flex-col bg-slate-900 overflow-hidden">
  <div class="h-[calc(100vh-100px)] flex flex-col bg-slate-900 text-slate-300 rounded-lg overflow-hidden border border-slate-700 shadow-2xl animate-enter">
    
    <div class="h-12 bg-slate-950 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
      <div class="flex items-center gap-4">
        <span class="font-bold text-slate-100 flex items-center gap-2">
           <span class="material-icons-outlined text-primary text-sm">code</span> Policy Studio
        </span>
        <div class="h-4 w-px bg-slate-700"></div>
        <span class="text-xs font-mono text-slate-400">{{ activeFileName }}</span>
        <span class="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 rounded border border-amber-500/30">Modified</span>
      </div>
      
      <div class="flex gap-2">
         <button class="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold transition flex items-center gap-2">
           <span class="material-icons-outlined text-xs">history</span> History
         </button>
         <button @click="savePolicy" class="px-3 py-1.5 rounded bg-primary text-white hover:bg-red-600 text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-900/50">
           <span class="material-icons-outlined text-xs">save</span> Save & Deploy
         </button>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      
      <div class="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
         <div class="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Explorer</div>
         <div class="space-y-0.5">
            <div 
              v-for="file in files" 
              :key="file.id"
              @click="activeFile = file.id"
              class="px-4 py-2 text-xs cursor-pointer flex items-center gap-2 border-l-2 transition-colors"
              :class="activeFile === file.id ? 'bg-slate-800 text-white border-primary' : 'border-transparent hover:bg-slate-800/50 text-slate-400'"
            >
               <span class="material-icons-outlined text-[16px]" :class="file.type === 'yaml' ? 'text-indigo-400' : 'text-yellow-400'">
                 {{ file.type === 'yaml' ? 'description' : 'data_object' }}
               </span>
               {{ file.name }}
               <span v-if="file.status === 'modified'" class="w-2 h-2 rounded-full bg-amber-500 ml-auto"></span>
            </div>
         </div>
      </div>

      <div class="flex-1 flex flex-col bg-[#1e1e1e] relative group">
         <div class="flex bg-slate-900">
            <div class="px-4 py-2 bg-[#1e1e1e] text-xs text-white border-t-2 border-primary flex items-center gap-2">
               {{ activeFileName }}
               <span class="material-icons-outlined text-[10px] hover:text-white cursor-pointer text-slate-500">close</span>
            </div>
         </div>
         
         <div class="flex-1 relative flex">
            <div class="w-10 bg-[#1e1e1e] text-slate-600 text-xs text-right pr-3 pt-4 select-none font-mono leading-6 border-r border-slate-800">
               <div v-for="n in 25" :key="n">{{ n }}</div>
            </div>
            <textarea 
               v-model="codeContent"
               class="flex-1 bg-[#1e1e1e] text-emerald-100 p-4 font-mono text-sm leading-6 focus:outline-none resize-none spellcheck-false"
               spellcheck="false"
            ></textarea>
         </div>
         
         <div class="bg-primary text-white text-[10px] px-2 py-0.5 absolute bottom-4 right-4 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            YAML • UTF-8
         </div>
      </div>

      <div class="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
         <div class="p-4 border-b border-slate-800">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider mb-4">Rule Simulator</h3>
            
            <div class="space-y-3">
               <div>
                  <label class="text-[10px] text-slate-500 block mb-1">Target Context (Case ID)</label>
                  <select class="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded p-2 focus:border-primary focus:outline-none">
                     <option>CASE-P0-OVT-2025-007 (High Risk)</option>
                     <option>CASE-P0-OVT-2025-008 (Pass)</option>
                  </select>
               </div>
               
               <button 
                 @click="runSimulation"
                 :disabled="isSimulating"
                 class="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition flex justify-center items-center gap-2"
               >
                  <span v-if="isSimulating" class="material-icons-outlined animate-spin text-xs">refresh</span>
                  <span v-else class="material-icons-outlined text-xs">play_arrow</span>
                  Test Run Logic
               </button>
            </div>
         </div>

         <div class="flex-1 p-4 overflow-y-auto font-mono text-[10px]">
            <div v-if="!simulationResult && !isSimulating && consoleLogs.length === 0" class="text-slate-600 text-center mt-10">
               Ready to simulate
            </div>
            
            <div class="space-y-1">
               <div v-for="(log, i) in consoleLogs" :key="i" class="text-slate-400">
                  {{ log }}
               </div>
            </div>

            <div v-if="simulationResult" class="mt-4 p-3 rounded border" 
               :class="simulationResult === 'PASS' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'">
               <div class="font-bold flex items-center gap-2">
                  <span class="material-icons-outlined text-sm">{{ simulationResult === 'PASS' ? 'check_circle' : 'error' }}</span>
                  SIMULATION {{ simulationResult }}
               </div>
            </div>
         </div>
      </div>

    </div>
    
    <div class="h-6 bg-slate-950 border-t border-slate-800 flex items-center px-4 text-[10px] text-slate-500 justify-between shrink-0">
       <div class="flex gap-4">
          <span>master*</span>
          <span class="flex items-center gap-1"><span class="material-icons-outlined text-[10px]">error</span> 0 Errors</span>
       </div>
       <div>
          TH8 Policy Engine v2.4.0
       </div>
    </div>
  </div>
   </div>
</template>