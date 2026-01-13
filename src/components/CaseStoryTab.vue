<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  story: any; // รับข้อมูล Story จาก Parent
  updatedAt?: string;
}>();

// Helper สีจุดหน้า Risk Drivers
const getDotColor = (color: string) => {
  if (color === 'red') return 'bg-rose-500';
  if (color === 'orange') return 'bg-amber-500';
  if (color === 'green') return 'bg-emerald-500';
  return 'bg-slate-400';
};
</script>

<template>
  <div v-if="story" class="space-y-6 animate-enter pb-10">
    
    <div>
      <h3 class="text-lg font-bold text-slate-400 uppercase tracking-wider mb-1">Decision Story</h3>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <h1 class="text-3xl font-extrabold text-slate-900">{{ story.headline }}</h1>
         
         <div class="flex items-center gap-3">
            <span class="text-xs text-slate-400">Run: {{ updatedAt ? new Date(updatedAt).toLocaleString() : '-' }}</span>
            <div class="px-4 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-bold shadow-sm">
               {{ story.suggested_action.title }}
            </div>
         </div>
      </div>
      <p class="text-slate-500 mt-2">Summary of "Why" derived from rule hits + policy + evidence links</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
       
       <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
          <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
             Risk Drivers
          </h4>
          <ul class="space-y-4 flex-1">
             <li v-for="(item, idx) in story.risk_drivers" :key="idx" class="flex gap-3 items-start">
                <div class="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" :class="getDotColor(item.color)"></div>
                <div>
                   <p class="font-bold text-slate-800 text-sm">{{ item.label }}</p>
                   <p class="font-mono text-xs text-slate-500 mt-0.5">{{ item.detail }}</p>
                </div>
             </li>
          </ul>
       </div>

       <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
          <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
             Business Impact
          </h4>
          <ul class="space-y-3 flex-1">
             <li v-for="(impact, idx) in story.business_impact" :key="idx" class="flex gap-3 items-start">
                <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0"></div>
                <p class="text-sm text-slate-700 font-medium leading-relaxed">{{ impact }}</p>
             </li>
          </ul>
       </div>

       <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
          <div class="absolute right-0 top-0 w-2 h-full bg-slate-900"></div>
          
          <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
             Suggested Action
          </h4>
          
          <div class="flex-1">
             <h3 class="text-xl font-bold text-slate-900 mb-2">{{ story.suggested_action.title }}</h3>
             <p class="text-sm text-slate-600 leading-relaxed mb-6">
                {{ story.suggested_action.description }}
             </p>
          </div>

          <div class="flex gap-3 mt-auto">
             <button class="flex-1 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                Open Evidence
             </button>
             <button class="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black transition shadow-lg shadow-slate-900/20">
                Decide
             </button>
          </div>
       </div>
    </div>

    <div v-if="story.evidence_list.length > 0" class="bg-slate-50 rounded-xl border border-slate-200 p-6">
       <div class="flex justify-between items-center mb-6">
          <div>
             <h4 class="text-lg font-bold text-slate-800">Evidence that backs the decision</h4>
             <p class="text-sm text-slate-500">Click to open document/clause immediately (RAG-as-Evidence)</p>
          </div>
          <span class="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm">
             {{ story.evidence_list.length }} evidence links
          </span>
       </div>

       <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(ev, idx) in story.evidence_list" :key="idx" 
               class="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition cursor-pointer group relative">
             
             <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Source Doc</span>
                <button class="text-xs font-bold text-slate-900 border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-50 transition group-hover:border-blue-200 group-hover:text-blue-700">Open</button>
             </div>

             <h5 class="font-bold text-slate-900 text-base mb-1">{{ ev.title }}</h5>
             <p class="text-xs text-slate-500 font-medium mb-3">{{ ev.subtitle }}</p>

             <p class="text-sm text-slate-700 mb-4">{{ ev.description }}</p>

             <div class="bg-slate-50 rounded border border-slate-100 px-3 py-2 font-mono text-[10px] text-slate-500 truncate">
                {{ ev.source_code }}
             </div>
          </div>
       </div>
    </div>

  </div>
  
  <div v-else class="text-center py-20 text-slate-400">
     <span class="material-icons-outlined text-4xl mb-2">auto_stories</span>
     <p>No story generated for this case.</p>
  </div>
</template>