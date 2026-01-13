<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useDecisionStore } from '../store';

const route = useRoute();
const store = useDecisionStore();
const reason = ref('');

const caseId = route.params.caseId as string;

onMounted(() => {
  store.loadContext(caseId);
});

// Helper for Rule Colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'PASS': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'FAIL': return 'text-red-600 bg-red-50 border-red-100';
    case 'WARNING': return 'text-amber-600 bg-amber-50 border-amber-100';
    default: return 'text-slate-500 bg-slate-50';
  }
};

const getIcon = (status: string) => {
   switch (status) {
    case 'PASS': return 'check_circle';
    case 'FAIL': return 'cancel';
    case 'WARNING': return 'warning';
    default: return 'help';
  }
};
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
    
    <div class="lg:col-span-8 space-y-6">
      
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md animate-enter">
        <div class="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-emerald-50/50 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        
        <div class="relative z-10 flex justify-between items-start">
          <div>
            <h2 class="text-xs font-bold text-emerald-700 tracking-wider uppercase mb-1 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              AI Recommendation
            </h2>
            <div class="text-6xl font-extrabold text-slate-900 tracking-tight mb-2">APPROVE</div>
             <div class="flex items-center gap-2 text-sm text-slate-500">
               <span class="material-icons-outlined text-sm">vpn_key</span>
               Required Role: <span class="font-bold text-slate-700">Procurement_Manager</span>
             </div>
          </div>

          <div class="text-right">
             <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">Risk Assessment</div>
             <div class="text-2xl font-bold text-red-600 flex items-center justify-end gap-2">
               HIGH <span class="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded border border-red-200">ACTION REQ.</span>
             </div>
             <div class="mt-4 flex gap-1 justify-end">
                <span class="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-mono rounded border border-slate-200">HIGH_AMOUNT_ESC</span>
                <span class="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-mono rounded border border-slate-200">SLA_RISK</span>
             </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
           <span class="text-[10px] font-mono text-slate-400">PHASE 4 ANALYSIS COMPLETE</span>
           <button class="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-all hover:translate-x-1">
             View Decision Logic Tree <span class="material-icons-outlined text-xs">arrow_forward</span>
           </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-enter" style="animation-delay: 100ms;">
        
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
           <h3 class="font-bold text-slate-800 text-sm mb-4">Case Snapshot</h3>
           <div class="grid grid-cols-2 gap-y-4 gap-x-2 mb-4">
              <div>
                <p class="text-[10px] uppercase text-slate-400 font-bold">Amount</p>
                <p class="text-lg font-mono font-bold text-slate-900">THB 3,200,000</p>
              </div>
              <div>
                <p class="text-[10px] uppercase text-slate-400 font-bold">Priority</p>
                <p class="text-lg font-bold text-red-600">HIGH</p>
              </div>
              <div>
                <p class="text-[10px] uppercase text-slate-400 font-bold">Created</p>
                <p class="text-xs font-mono text-slate-600">2026-01-01 <span class="text-slate-400">16:25</span></p>
              </div>
              <div>
                <p class="text-[10px] uppercase text-slate-400 font-bold">Evaluated</p>
                <p class="text-xs font-mono text-slate-600">2026-01-01 <span class="text-slate-400">17:16</span></p>
              </div>
           </div>
           <div class="bg-slate-50 border border-slate-100 rounded p-3">
             <p class="text-[10px] uppercase text-slate-400 font-bold mb-1">Pending Reason</p>
             <p class="text-xs font-medium text-slate-700">Approval required (policy threshold > 1M THB)</p>
           </div>
        </div>

        <div class="flex flex-col gap-6">
           <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex-1">
             <h3 class="font-bold text-slate-800 text-sm mb-2">Policy Binding</h3>
             <p class="text-xs text-slate-500 mb-4">Immutable • Not embedded in code</p>
             <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div>
                  <p class="text-[10px] uppercase text-slate-400 font-bold">Policy ID</p>
                  <p class="text-sm font-bold text-slate-800 font-mono">PROCUREMENT-001</p>
                </div>
                <span class="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-500">v3.0.1</span>
             </div>
           </div>
           
           <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <span class="text-xs font-bold text-slate-600">Rules Passed</span>
              <div class="flex gap-1">
                 <div class="w-8 h-1.5 rounded-full bg-emerald-500"></div>
                 <div class="w-8 h-1.5 rounded-full bg-emerald-500"></div>
                 <div class="w-8 h-1.5 rounded-full bg-amber-400"></div> <div class="w-8 h-1.5 rounded-full bg-emerald-500"></div>
              </div>
           </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-enter" style="animation-delay: 200ms;">
        <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 class="font-bold text-slate-800 flex items-center gap-2">
            <span class="material-icons-outlined text-slate-400">format_list_bulleted</span>
            Detailed Logic Trace
          </h3>
          <span class="text-xs text-slate-400 font-mono">Trace ID: {{ caseId.split('-')[3] || '88291' }}</span>
        </div>

        <div v-if="store.state.isProcessing && store.state.rules.length === 0" class="p-8 space-y-4">
           <div class="h-12 bg-slate-50 rounded animate-pulse"></div>
           <div class="h-12 bg-slate-50 rounded animate-pulse"></div>
        </div>

        <div v-else class="divide-y divide-slate-100">
          <div v-for="rule in store.state.rules" :key="rule.id" class="p-4 hover:bg-slate-50/50 transition-colors">
            <div class="flex items-start gap-3">
              <div class="shrink-0 mt-0.5">
                   <span class="material-icons-outlined text-sm" :class="rule.status === 'PASS' ? 'text-emerald-500' : 'text-amber-500'">
                     {{ getIcon(rule.status) }}
                   </span>
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-start">
                  <h4 class="text-xs font-bold text-slate-900">{{ rule.name }}</h4>
                  <span class="font-mono text-[10px] text-slate-400 uppercase">{{ rule.code }}</span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">{{ rule.message }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="lg:col-span-4 space-y-6 animate-enter" style="animation-delay: 300ms;">
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-6">
         
         <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-slate-800 text-lg">Decision Action</h3>
            <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100">Human-in-the-loop</span>
         </div>
         
         <div v-if="store.state.userDecision" class="text-center py-8">
            <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="material-icons-outlined text-3xl">check</span>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-1">Decision Recorded</h3>
            <p class="text-sm text-slate-500">
              You have <span class="font-bold">{{ store.state.userDecision }}</span> this case.
            </p>
            <div class="mt-6 p-3 bg-slate-50 rounded text-xs text-slate-400 font-mono text-left">
              <div class="flex justify-between mb-1">
                <span>HASH:</span> <span>0x7f...3a2b</span>
              </div>
              <div class="flex justify-between">
                <span>TS:</span> <span>{{ new Date().toISOString().split('T')[1] }}</span>
              </div>
            </div>
         </div>

         <div v-else>
           <p class="text-xs text-slate-500 mb-4 leading-relaxed">
             Please provide a reason for your decision. This will be recorded in the immutable audit log.
           </p>

           <div class="mb-4">
             <textarea 
               v-model="reason"
               class="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition resize-none placeholder-slate-300" 
               rows="4"
               placeholder="Reason / Note..."
             ></textarea>
           </div>
           
           <div class="flex gap-3">
             <button 
               @click="store.submit('REJECT', reason)"
               :disabled="store.state.isProcessing"
               class="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold text-sm 
                      hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-all"
             >
               Reject Case
             </button>
             
             <button 
               @click="store.submit('APPROVE', reason)"
               :disabled="store.state.isProcessing"
               class="flex-1 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm shadow-md 
                      hover:bg-black transition-all flex items-center justify-center gap-2"
             >
               <span v-if="store.state.isProcessing" class="material-icons-outlined animate-spin text-xs">refresh</span>
               <span v-else class="material-icons-outlined text-xs">check</span>
               Approve Case
             </button>
           </div>
           
           <p class="text-[10px] text-slate-400 text-center mt-6 italic">
             Selling Point: ระบบมั่นใจ "โปร่งใส" ทุกคำสั่ง decision มีหลักฐาน + auditability ตรวจสอบย้อนหลังได้ 100%
           </p>
         </div>
      </div>
    </div>
  </div>
</template>