<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { auditApi } from '../api';
import type { AuditLog } from '../types';

const route = useRoute();
const logs = ref<AuditLog[]>([]);
const isLoading = ref(true);

// เก็บ ID ของ Log ที่ถูกเปิดอยู่
const expandedLogs = ref<Set<string>>(new Set());

onMounted(async () => {
  try {
    isLoading.value = true;
    logs.value = await auditApi.getLogs(route.params.caseId as string);
  } finally {
    isLoading.value = false;
  }
});

const toggleLog = (id: string) => {
  if (expandedLogs.value.has(id)) {
    expandedLogs.value.delete(id);
  } else {
    expandedLogs.value.add(id);
  }
};

const isExpanded = (id: string) => expandedLogs.value.has(id);
const hasContext = (log: AuditLog) => log.context && log.context.length > 0;
const isRuleLog = (log: AuditLog) => log.action.includes('RULE') || log.action.includes('EVALUATED');

const formatDate = (ts: string) => {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

const getEventConfig = (type: string) => {
  if (type.includes('INGEST')) return { icon: 'inventory_2', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' };
  if (type.includes('RULE')) return { icon: 'gavel', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' };
  if (type.includes('DECISION')) return { icon: 'psychology', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' };
  if (type.includes('COMPLETED')) return { icon: 'flag', bg: 'bg-slate-800', text: 'text-white', border: 'border-slate-600', badge: 'bg-slate-700 text-slate-200' };
  if (type.includes('RISK')) return { icon: 'warning', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' };
  return { icon: 'info', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600' };
};
</script>

<template>
  <div class="max-w-4xl mx-auto pb-20 animate-enter">
    
    <div class="bg-slate-900 text-slate-300 p-4 rounded-t-xl flex justify-between items-center shadow-lg sticky top-4 z-20">
      <div class="flex items-center gap-3">
        <span class="material-icons-outlined text-emerald-400">shield</span>
        <div>
           <h2 class="text-sm font-bold text-white uppercase tracking-wider">Immutable Audit Trail</h2>
           <p class="text-[10px] text-slate-400">Ledger ID: {{ route.params.caseId }}</p>
        </div>
      </div>
      <div class="flex flex-col items-end">
         <span class="text-[10px] font-bold text-slate-500 uppercase">Security Level</span>
         <span class="flex items-center gap-1 text-xs text-emerald-400 font-bold">
           <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Tamper-Proof
         </span>
      </div>
    </div>

    <div class="bg-white border border-t-0 border-slate-200 rounded-b-xl px-8 pt-8 pb-32 min-h-[600px] relative">
      
      <div class="absolute left-12 top-8 bottom-8 w-px bg-slate-200"></div>

      <div v-if="isLoading" class="pl-16 space-y-8">
         <div v-for="i in 4" :key="i" class="h-24 bg-slate-50 rounded-xl animate-pulse"></div>
      </div>

      <div v-else class="space-y-6">
        <div v-for="(log, index) in logs" :key="log.id" class="relative pl-12 group">
           
           <div v-if="isRuleLog(log)" 
                class="absolute left-[13px] top-[-20px] bottom-[50%] w-6 border-l border-b border-slate-200 rounded-bl-xl -z-0">
           </div>

           <div 
             class="absolute left-0 top-0 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110"
             :class="[
                getEventConfig(log.action).bg, 
                getEventConfig(log.action).text,
                isRuleLog(log) ? 'w-6 h-6 left-1 text-[10px]' : 'w-8 h-8 text-sm'
             ]"
           >
              <span class="material-icons-outlined" :class="isRuleLog(log) ? 'text-[12px]' : 'text-sm'">
                {{ getEventConfig(log.action).icon }}
              </span>
           </div>

           <div class="bg-white border rounded-lg transition-all hover:shadow-md overflow-hidden relative"
                :class="[
                  getEventConfig(log.action).border,
                  hasContext(log) ? 'cursor-pointer' : '',
                  isRuleLog(log) ? 'ml-10 border-l-4' : ''
                ]"
                @click="hasContext(log) && toggleLog(log.id)">
              
              <div class="flex justify-between items-start p-4 bg-opacity-10"
                   :class="isExpanded(log.id) ? 'bg-slate-50' : 'bg-white'">
                 <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide" 
                              :class="getEventConfig(log.action).badge">
                              {{ log.action.split('_')[0] }}
                        </span>
                        
                        <span class="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                           <span class="material-icons-outlined text-[10px]">schedule</span>
                           {{ formatDate(log.timestamp) }}
                        </span>
                    </div>

                    <h3 class="font-bold text-slate-800 text-sm">{{ log.action.replace(/_/g, ' ') }}</h3>
                    
                    <p v-if="!hasContext(log)" class="text-sm text-slate-500 italic mt-1">{{ log.message }}</p>
                    <p v-else-if="!isExpanded(log.id)" class="text-[10px] text-slate-400 mt-1 select-none flex items-center gap-1">
                       <span class="material-icons-outlined text-[10px]">visibility</span> View details...
                    </p>
                 </div>

                 <div class="flex items-center gap-3">
                    <div class="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                       {{ log.actor.name }}
                    </div>
                    
                    <span v-if="hasContext(log)" 
                          class="material-icons-outlined text-slate-400 text-lg transition-transform duration-300"
                          :class="{'rotate-180': isExpanded(log.id)}">
                      expand_more
                    </span>
                 </div>
              </div>

              <transition 
                enter-active-class="transition duration-200 ease-out" 
                enter-from-class="transform scale-y-95 opacity-0" 
                enter-to-class="transform scale-y-100 opacity-100"
                leave-active-class="transition duration-150 ease-in" 
                leave-from-class="transform scale-y-100 opacity-100" 
                leave-to-class="transform scale-y-95 opacity-0"
              >
                <div v-if="hasContext(log) && isExpanded(log.id)" 
                     class="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50">
                    
                    <div class="mt-2 grid grid-cols-2 gap-y-3 gap-x-4">
                        <div v-for="(item, idx) in log.context" :key="idx" 
                             :class="{'col-span-2 border-t border-slate-200 pt-2 mt-1': item.fullWidth}">
                            
                            <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">{{ item.label }}</span>
                            
                            <span v-if="item.type === 'currency'" class="text-base font-bold text-emerald-600 font-mono">{{ item.value }}</span>
                            
                            <span v-else-if="item.type === 'badge'" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                                  :class="item.badgeColor === 'red' ? 'bg-red-100 text-red-700' : item.badgeColor === 'green' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'">
                               {{ item.value }}
                            </span>
                            
                            <span v-else-if="item.type === 'mono'" class="text-xs font-mono text-slate-600 break-all bg-white px-1 rounded border border-slate-200">{{ item.value }}</span>
                            
                            <span v-else class="text-sm text-slate-700 font-medium" :class="{'text-slate-900 font-bold': item.highlight}">
                               {{ item.value }}
                            </span>
                        </div>
                    </div>
                </div>
              </transition>

           </div>
        </div>
      </div>

    </div>
  </div>
</template>