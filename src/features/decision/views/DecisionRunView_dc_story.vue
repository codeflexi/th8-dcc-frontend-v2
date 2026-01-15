<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useDecisionStore } from '../store';
// ✅ Import Component Story ที่ทำไปเมื่อกี้
import CaseStoryTab from '@/components/CaseStoryTab.vue';

const route = useRoute();
const store = useDecisionStore();
const reason = ref('');
const caseId = route.params.caseId as string;

// ✅ State สำหรับ Tabs
const activeTab = ref('story');

onMounted(() => {
  store.loadContext(caseId);
});

// Helpers
const detail = computed(() => store.state.caseDetail);

// ✅ Computed สำหรับสรุปยอด (เอาไว้โชว์บน Tab)
const riskRulesCount = computed(() => store.state.rules.filter(r => r.hit).length);
const passedRulesCount = computed(() => store.state.rules.filter(r => !r.hit).length);

const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('th-TH') : '-';

const formatValue = (val?: number) => {
  if (val === undefined) return '0';
  if (detail.value?.currency === 'Days') return `${val} Days`;
  return val.toLocaleString('th-TH');
};

const getLabel = (type: 'subject' | 'ref' | 'amount') => {
  const domain = detail.value?.domain || 'PROCUREMENT';
  if (domain === 'HR') {
     if (type === 'subject') return 'Employee';
     if (type === 'ref') return 'Request ID';
     if (type === 'amount') return 'Duration';
  }
  // Default (Procurement)
  if (type === 'subject') return 'Vendor';
  if (type === 'ref') return 'PO Number';
  if (type === 'amount') return 'Total Amount';
  return '';
};

const getRecColor = (rec: string) => {
    if (rec === 'APPROVE') return 'emerald';
    if (rec === 'REJECT') return 'rose';
    if (rec === 'ESCALATE') return 'amber';
    return 'indigo'; 
};

const handleRun = () => {
  store.runAnalysis();
};
</script>

<template>
  <div v-if="store.state.isProcessing" class="h-[600px] flex flex-col items-center justify-center animate-pulse">
    <div class="w-16 h-16 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4"></div>
    <p class="text-slate-500 font-medium">Running AI Policy Engine...</p>
    <p class="text-xs text-slate-400 mt-2">Evaluating Logic against {{ detail?.policyId }}</p>
  </div>

  <div v-else-if="detail" class="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20 animate-enter">
    
    <div class="lg:col-span-8 space-y-6">
      
      <div class="bg-white rounded-xl border p-6 shadow-sm relative overflow-hidden group"
           :class="`border-${getRecColor(store.state.recommendation)}-100`">
         <div class="absolute left-0 top-0 bottom-0 w-2" 
              :class="`bg-${getRecColor(store.state.recommendation)}-500`"></div>
         <div class="flex justify-between items-start pl-2">
            <div>
              <h2 class="text-xs font-bold tracking-wider uppercase mb-1 flex items-center gap-2" 
                  :class="`text-${getRecColor(store.state.recommendation)}-700`">
                 AI RECOMMENDATION
              </h2>
              <div class="text-5xl font-extrabold tracking-tight mb-2 text-slate-900">
                {{ store.state.recommendation }}
              </div>
              <div class="flex items-center gap-4 mt-2">
                  <div class="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                      Policy: {{ detail.policyId }}
                  </div>
                  <div class="text-sm text-slate-500">
                      Confidence Score: <strong class="text-slate-800">{{ store.state.confidenceScore }}%</strong>
                  </div>
              </div>
            </div>
            <div class="text-right flex flex-col items-end">
               <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">Risk Level</div>
               <div class="text-2xl font-bold mb-3" 
                    :class="detail.riskLevel === 'HIGH' ? 'text-rose-600' : 'text-emerald-600'">
                 {{ detail.riskLevel }}
               </div>
               <button @click="handleRun" class="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition shadow-sm active:scale-95">
                 <span class="material-icons-outlined text-sm">refresh</span> Re-run
               </button>
            </div>
         </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
         <div class="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
             <div class="flex items-center gap-2">
                <h3 class="font-bold text-slate-800 text-sm">Case Snapshot</h3>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border font-bold">{{ detail.domain }}</span>
             </div>
             <span class="text-[10px] text-slate-400 font-mono">ID: {{ detail.id }}</span>
         </div>
         <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p class="text-[10px] uppercase text-slate-400 font-bold mb-1">{{ getLabel('amount') }}</p>
              <p class="text-lg font-mono font-bold text-slate-900">
                  {{ formatValue(detail.amount) }}
                  <span v-if="detail.currency !== 'Days'" class="text-xs text-slate-400 ml-1">{{ detail.currency }}</span>
              </p>
            </div>
            <div>
              <p class="text-[10px] uppercase text-slate-400 font-bold mb-1">{{ getLabel('subject') }}</p>
              <p class="text-sm font-bold text-slate-800 truncate" :title="detail.subjectName">{{ detail.subjectName }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase text-slate-400 font-bold mb-1">{{ getLabel('ref') }}</p>
              <p class="text-sm font-mono text-slate-700">{{ detail.referenceNo }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase text-slate-400 font-bold mb-1">Issue Date</p>
              <p class="text-sm font-mono text-slate-700">{{ formatDate(detail.issueDate) }}</p>
            </div>
            <div v-for="attr in detail.attributes" :key="attr.label">
               <p class="text-[10px] uppercase text-slate-400 font-bold mb-1">{{ attr.label }}</p>
               <p class="text-sm text-slate-700">{{ attr.value }}</p>
            </div>
         </div>
      </div>

      <div v-if="detail.lineItems.length > 0" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div class="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Line Items ({{ detail.lineItems.length }})</span>
         </div>
         <table class="w-full text-left text-xs">
             <thead class="bg-white border-b border-slate-100 text-slate-400 font-medium">
                 <tr>
                    <th class="px-4 py-2 font-normal">Item / Desc</th>
                    <th class="px-4 py-2 text-right font-normal">Qty</th>
                    <th class="px-4 py-2 text-right font-normal">Total</th>
                 </tr>
             </thead>
             <tbody class="divide-y divide-slate-50">
                 <tr v-for="(item, idx) in detail.lineItems" :key="idx">
                    <td class="px-4 py-2">
                        <span class="font-mono text-slate-500 mr-2">{{ item.sku }}</span>
                        <span class="text-slate-700">{{ item.item_desc }}</span>
                    </td>
                    <td class="px-4 py-2 text-right font-mono text-slate-500">{{ item.quantity }}</td>
                    <td class="px-4 py-2 text-right font-mono text-slate-800">{{ formatValue(item.total_price) }}</td>
                 </tr>
             </tbody>
         </table>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          
          <div class="flex border-b border-slate-200 bg-slate-50/50">
             <button @click="activeTab = 'story'"
                     class="flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors relative"
                     :class="activeTab === 'story' ? 'border-slate-800 text-slate-800 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'">
                 <span class="material-icons-outlined text-lg">auto_stories</span>
                 Decision Story
                 <span v-if="detail.story" class="absolute top-3 right-4 w-2 h-2 rounded-full bg-blue-500"></span>
             </button>

             <button @click="activeTab = 'trace'"
                     class="flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors"
                     :class="activeTab === 'trace' ? 'border-slate-800 text-slate-800 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'">
                 <span class="material-icons-outlined text-lg">account_tree</span>
                 Logic Trace
                 
                 <span v-if="riskRulesCount > 0" class="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] border border-amber-200">
                    {{ riskRulesCount }}
                 </span>
             </button>
          </div>

          <div class="p-0">
             
             <div v-show="activeTab === 'story'" class="p-6">
                 <CaseStoryTab :story="detail.story" :updatedAt="detail.evaluated_at" />
             </div>

             <div v-show="activeTab === 'trace'" class="bg-slate-50/30 p-6 space-y-4">
                 
                 <div v-for="rule in store.state.rules" :key="rule.id" 
                   class="bg-white rounded-lg border transition-all duration-200 overflow-hidden shadow-sm"
                   :class="rule.hit ? 'border-amber-200 shadow-amber-100' : 'border-slate-200 opacity-90 hover:opacity-100'">
                 
                     <div class="p-4 flex items-start gap-4">
                        <div class="shrink-0 pt-1">
                            <span v-if="rule.hit" class="material-icons-outlined text-amber-500 text-xl">warning</span>
                            <span v-else class="material-icons-outlined text-emerald-500 text-xl">check_circle</span>
                        </div>
                        
                        <div class="flex-1 w-full">
                            <div class="flex justify-between items-start mb-1">
                                <h4 class="text-sm font-bold text-slate-900 leading-tight">{{ rule.description }}</h4>
                                <span class="ml-2 text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider shrink-0"
                                      :class="rule.hit ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'">
                                    {{ rule.hit ? 'RISK DETECTED' : 'PASSED' }}
                                </span>
                            </div>
                            
                            <p class="text-[10px] text-slate-400 font-mono mb-2">{{ rule.id }}</p>

                            <div v-if="!rule.hit" class="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 font-mono break-all">
                               {{ rule.inputs }}
                            </div>
                           
                            <div v-if="rule.hit && rule.matched.length > 0" class="mt-3 bg-white rounded border border-amber-100 overflow-hidden">
                                <table class="w-full text-left text-xs">
                                    <thead class="bg-amber-50 text-amber-800 font-bold border-b border-amber-100">
                                        <tr>
                                            <th class="px-3 py-1.5 w-1/4">Condition</th>
                                            <th class="px-3 py-1.5 w-1/4">Logic</th>
                                            <th class="px-3 py-1.5 text-right w-1/4">Limit</th>
                                            <th class="px-3 py-1.5 text-right w-1/4">Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-amber-50">
                                        <tr v-for="(m, i) in rule.matched" :key="i">
                                            <td class="px-3 py-2 font-mono text-slate-600">{{ m.field }}</td>
                                            <td class="px-3 py-2 text-slate-500 font-bold">{{ m.operator }}</td>
                                            <td class="px-3 py-2 text-right font-mono text-slate-500">{{ m.expected }}</td>
                                            <td class="px-3 py-2 text-right font-mono font-bold text-rose-600">{{ m.actual }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                     </div>
                  </div>
                  
                  <div class="mt-4 text-center text-xs text-slate-400">
                      Evaluated {{ store.state.rules.length }} rules against policy {{ detail.policyId }}
                  </div>

             </div>
          </div>
      </div>

    </div>

    <div class="lg:col-span-4 space-y-6">
       <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-6">
          <div class="flex justify-between items-center mb-4">
             <h3 class="font-bold text-slate-800">Final Decision</h3>
             <span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold">Human-in-the-loop</span>
          </div>
          
          <div v-if="store.state.userDecision">
             <div class="bg-emerald-50 text-emerald-700 p-6 rounded-xl text-center border border-emerald-100 flex flex-col items-center gap-2">
               <div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                   <span class="material-icons-outlined text-2xl">verified</span>
               </div>
               <div>
                   <h3 class="font-bold text-lg">Case Approved</h3>
                   <p class="text-xs text-emerald-600">Recorded on Blockchain Audit</p>
               </div>
             </div>
          </div>

          <div v-else class="space-y-4">
             <p class="text-xs text-slate-500">
               Based on the <strong>{{ store.state.recommendation }}</strong> recommendation, please verify the evidence and submit your final decision.
             </p>
             <textarea v-model="reason" class="w-full p-3 border border-slate-200 rounded-lg text-sm h-32 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-none" placeholder="Enter reason or approval note..."></textarea>
             
             <div class="grid grid-cols-2 gap-3">
                <button @click="store.submit('REJECT', reason)" 
                        class="py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-bold text-slate-700 transition flex justify-center items-center gap-2">
                    <span class="material-icons-outlined text-sm">close</span> Reject
                </button>
                <button @click="store.submit('APPROVE', reason)" 
                        class="py-2.5 bg-slate-900 text-white rounded-lg hover:bg-black text-sm font-bold transition shadow-lg shadow-slate-900/20 flex justify-center items-center gap-2">
                    <span class="material-icons-outlined text-sm">check</span> Approve
                </button>
             </div>
          </div>
       </div>
    </div>

  </div>
</template>