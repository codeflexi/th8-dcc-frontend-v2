<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { evidenceApi } from '../api';
import type { EvidenceItem } from '../types';

const route = useRoute();
const query = ref('High value procurement approval threshold');
const results = ref<EvidenceItem[]>([]);
const isLoading = ref(false);
const activeItem = ref<EvidenceItem | null>(null);
const attachedIds = ref<Set<string>>(new Set());
const isAttaching = ref(false);

// Auto-search on mount
onMounted(() => {
  handleSearch();
});

async function handleSearch() {
  isLoading.value = true;
  try {
    results.value = await evidenceApi.search(query.value);
    // Auto-select first result
    if (results.value.length > 0) {
      activeItem.value = results.value[0];
    }
  } finally {
    isLoading.value = false;
  }
}

async function attachEvidence() {
  if (!activeItem.value) return;
  isAttaching.value = true;
  try {
    await evidenceApi.attach(route.params.caseId as string, activeItem.value.id);
    attachedIds.value.add(activeItem.value.id);
  } finally {
    isAttaching.value = false;
  }
}

const getScoreColor = (score: number) => {
  if (score >= 0.9) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 0.7) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-slate-500 bg-slate-50 border-slate-200';
};
</script>

<template>
  <div class="h-[calc(100vh-140px)] flex flex-col animate-enter">
    
    <div class="flex items-center gap-4 mb-4 shrink-0">
      <div class="flex-1 relative">
        <span class="absolute left-3 top-2.5 material-icons-outlined text-slate-400">search</span>
        <input 
          v-model="query"
          @keydown.enter="handleSearch"
          type="text" 
          class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          placeholder="Ask a question to find evidence (e.g., 'What is the limit for split PO?')"
        />
      </div>
      <button 
        @click="handleSearch"
        class="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-black transition shadow-md flex items-center gap-2"
      >
        <span v-if="isLoading" class="material-icons-outlined animate-spin text-sm">refresh</span>
        <span v-else class="material-icons-outlined text-sm">auto_awesome</span>
        AI Search
      </button>
    </div>

    <div class="flex-1 flex gap-6 overflow-hidden">
      
      <div class="w-[400px] flex flex-col gap-3 overflow-y-auto pr-1 pb-10">
        <div class="flex justify-between items-end mb-1">
           <h3 class="text-xs font-bold text-slate-500 uppercase">Suggested Evidence ({{ results.length }})</h3>
           <span class="text-[10px] text-slate-400">Sorted by Relevance</span>
        </div>

        <div v-if="isLoading" class="space-y-3">
           <div v-for="i in 3" :key="i" class="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
        </div>

        <div 
          v-for="item in results" 
          :key="item.id"
          @click="activeItem = item"
          class="bg-white border p-4 rounded-xl cursor-pointer transition-all duration-200 group relative hover:shadow-md"
          :class="activeItem?.id === item.id ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-slate-200 hover:border-slate-300'"
        >
          <div v-if="activeItem?.id === item.id" class="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r"></div>

          <div class="flex justify-between items-start mb-2 pl-2">
            <div class="flex items-center gap-2">
               <span class="material-icons-outlined text-red-500 text-lg">picture_as_pdf</span>
               <div>
                 <p class="text-sm font-bold text-slate-800 leading-tight line-clamp-1">{{ item.docTitle }}</p>
                 <p class="text-[10px] text-slate-500">Page {{ item.page }} • {{ item.matchType }} Match</p>
               </div>
            </div>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border" :class="getScoreColor(item.score)">
              {{ (item.score * 100).toFixed(0) }}%
            </span>
          </div>

          <p class="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic mb-3 pl-2 line-clamp-3">
            "...{{ item.content }}..."
          </p>

          <div class="flex justify-between items-center pl-2">
             <div v-if="attachedIds.has(item.id)" class="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span class="material-icons-outlined text-[10px]">link</span> Attached
             </div>
             <div v-else class="text-[10px] text-slate-400">Click to preview</div>
          </div>
        </div>
      </div>

      <div class="flex-1 bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden flex flex-col shadow-inner">
        
        <div class="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center shadow-sm z-10">
           <div class="flex items-center gap-2">
              <span class="material-icons-outlined text-slate-400">description</span>
              <span class="font-bold text-sm text-slate-700">{{ activeItem?.docTitle || 'Select a document' }}</span>
              <span v-if="activeItem" class="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs">Page {{ activeItem.page }}</span>
           </div>
           
           <button 
             v-if="activeItem"
             @click="attachEvidence"
             :disabled="attachedIds.has(activeItem.id) || isAttaching"
             class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
             :class="attachedIds.has(activeItem.id) 
               ? 'bg-emerald-100 text-emerald-700 cursor-default' 
               : 'bg-primary text-white hover:bg-red-700 shadow-sm hover:shadow'"
           >
             <span v-if="isAttaching" class="material-icons-outlined animate-spin text-sm">refresh</span>
             <span v-else-if="attachedIds.has(activeItem.id)" class="material-icons-outlined text-sm">check</span>
             <span v-else class="material-icons-outlined text-sm">add_link</span>
             
             {{ attachedIds.has(activeItem.id) ? 'Evidence Linked' : 'Confirm & Attach' }}
           </button>
        </div>

        <div class="flex-1 overflow-auto p-8 flex justify-center bg-slate-200/50">
           
           <div v-if="activeItem" class="relative bg-white shadow-xl w-[595px] h-[842px] transition-transform duration-300 origin-top">
              
              <div class="p-12 space-y-4 opacity-30 pointer-events-none select-none">
                 <div class="h-8 bg-slate-800 w-1/3 mb-8"></div> <div class="flex justify-between mb-8">
                    <div class="w-1/3 space-y-2"><div class="h-2 bg-slate-400 w-full"></div><div class="h-2 bg-slate-400 w-2/3"></div></div>
                    <div class="w-1/4 space-y-2"><div class="h-2 bg-slate-400 w-full"></div><div class="h-2 bg-slate-400 w-full"></div></div>
                 </div>
                 <div class="h-px bg-slate-300 my-6"></div>
                 <div v-for="n in 12" :key="n" class="h-2 bg-slate-400 w-full"></div>
                 <div class="flex gap-4"><div class="h-20 bg-slate-200 w-1/2"></div><div class="h-20 bg-slate-200 w-1/2"></div></div>
                 <div v-for="n in 8" :key="n+'b'" class="h-2 bg-slate-400 w-full"></div>
              </div>

              <div 
                v-if="activeItem.highlightBox"
                class="absolute border-2 border-primary bg-primary/10 transition-all duration-500 ease-out cursor-pointer group"
                :style="{
                  left: activeItem.highlightBox.x + '%',
                  top: activeItem.highlightBox.y + '%',
                  width: activeItem.highlightBox.w + '%',
                  height: activeItem.highlightBox.h + '%'
                }"
              >
                 <div class="absolute -top-7 left-0 bg-primary text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <span class="material-icons-outlined text-[10px]">auto_awesome</span>
                    AI Found: Semantic Match ({{ (activeItem.score*100).toFixed(0) }}%)
                 </div>
              </div>

           </div>

           <div v-else class="flex flex-col items-center justify-center text-slate-400 mt-20">
              <span class="material-icons-outlined text-6xl mb-4 opacity-50">plagiarism</span>
              <p class="text-sm">Select a search result to preview document</p>
           </div>
        </div>

      </div>

    </div>
  </div>
</template>