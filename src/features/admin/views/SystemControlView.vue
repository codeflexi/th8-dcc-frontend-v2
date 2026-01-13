<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminApi } from '../api';
import type { SystemRule, RAGDocument } from '../types';

const activeTab = ref<'RULES' | 'KNOWLEDGE'>('RULES');
const rules = ref<SystemRule[]>([]);
const docs = ref<RAGDocument[]>([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    isLoading.value = true;
    const [rulesData, docsData] = await Promise.all([
      adminApi.getRules(),
      adminApi.getDocuments()
    ]);
    rules.value = rulesData;
    docs.value = docsData;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
 <div class="h-full  overflow-y-auto bg-slate-50 p-6">
    <div class="max-w-6xl mx-auto w-full animate-enter space-y-6">
    
    <div>
      <h1 class="text-2xl font-bold text-slate-900">System Control Center</h1>
      <p class="text-slate-500 text-sm mt-1">Manage AI Logic (Rules) and Knowledge Base (RAG Source)</p>
    </div>

    <div class="border-b border-slate-200">
      <nav class="-mb-px flex space-x-6">
        <button 
          @click="activeTab = 'RULES'"
          class="pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2"
          :class="activeTab === 'RULES' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'"
        >
          <span class="material-icons-outlined">gavel</span>
          Active Logic & Rules
          <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{{ rules.length }}</span>
        </button>
        <button 
          @click="activeTab = 'KNOWLEDGE'"
          class="pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2"
          :class="activeTab === 'KNOWLEDGE' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'"
        >
          <span class="material-icons-outlined">library_books</span>
          RAG Knowledge Base
          <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{{ docs.length }}</span>
        </button>
      </nav>
    </div>

    <div v-if="isLoading" class="space-y-4">
       <div v-for="i in 3" :key="i" class="h-16 bg-slate-50 rounded animate-pulse"></div>
    </div>

    <div v-else>
      
      <div v-if="activeTab === 'RULES'" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th class="px-6 py-3">Rule Code</th>
              <th class="px-6 py-3">Logic Type</th>
              <th class="px-6 py-3">Category</th>
              <th class="px-6 py-3">Description</th>
              <th class="px-6 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="rule in rules" :key="rule.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 font-mono text-sm font-bold text-slate-900">{{ rule.code }}</td>
              <td class="px-6 py-4">
                <span class="text-[10px] font-bold px-2 py-1 rounded border"
                  :class="rule.logicType === 'LLM_AGENT' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-orange-50 text-orange-700 border-orange-100'">
                  {{ rule.logicType.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-6 py-4 text-xs font-bold text-slate-500">{{ rule.category }}</td>
              <td class="px-6 py-4 text-sm text-slate-600">{{ rule.description }}</td>
              <td class="px-6 py-4 text-center">
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'KNOWLEDGE'" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th class="px-6 py-3">Filename</th>
              <th class="px-6 py-3">Policy Version</th>
              <th class="px-6 py-3">Upload Date</th>
              <th class="px-6 py-3 text-right">Vectors (Chunks)</th>
              <th class="px-6 py-3 text-center">Index Status</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="doc in docs" :key="doc.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <span class="material-icons-outlined text-slate-400">description</span>
                  <span class="font-medium text-slate-900 text-sm">{{ doc.filename }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600 font-mono">{{ doc.policyVersion }}</td>
              <td class="px-6 py-4 text-sm text-slate-500">{{ doc.uploadDate }}</td>
              <td class="px-6 py-4 text-right font-mono text-sm">{{ doc.chunkCount.toLocaleString() }}</td>
              <td class="px-6 py-4 text-center">
                <span class="text-[10px] font-bold px-2 py-1 rounded border"
                  :class="doc.vectorStatus === 'INDEXED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse'">
                  {{ doc.vectorStatus }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button class="text-slate-400 hover:text-primary transition">
                  <span class="material-icons-outlined text-sm">visibility</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
  </div>
</template>