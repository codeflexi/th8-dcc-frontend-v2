
<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
const caseId = route.params.caseId;
</script>

<template>
  <div class="flex flex-col h-full space-y-6">
    <div>
       <RouterLink to="/cases" class="text-xs font-medium text-slate-400 hover:text-primary flex items-center gap-1 mb-2 transition-colors">
         <span class="material-icons-outlined text-sm">arrow_back</span> Back to Portfolio
       </RouterLink>
       <h1 class="text-2xl font-bold font-mono text-slate-900">{{ caseId }}</h1>
    </div>

    <div class="border-b border-slate-200">
      <nav class="-mb-px flex space-x-2" aria-label="Tabs">
        <RouterLink 
          :to="`/cases/${caseId}`" 
          active-class="bg-slate-100 text-primary border-b-2 border-primary font-bold"
          exact-active-class="bg-slate-100 text-primary border-b-2 border-primary font-bold"
          class="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg transition-all flex items-center gap-2"
        >
          <span class="material-icons-outlined text-lg">gavel</span>
          Decision & Rules
        </RouterLink>

        <RouterLink 
          :to="`/cases/${caseId}/evidence`" 
          active-class="bg-slate-100 text-primary border-b-2 border-primary font-bold"
          class="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg transition-all flex items-center gap-2"
        >
          <span class="material-icons-outlined text-lg">fact_check</span>
          Evidence Trace
        </RouterLink>

        <RouterLink 
          :to="`/cases/${caseId}/audit`" 
          active-class="bg-slate-100 text-primary border-b-2 border-primary font-bold"
          class="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg transition-all flex items-center gap-2"
        >
          <span class="material-icons-outlined text-lg">history</span>
          Audit Timeline
        </RouterLink>
      </nav>
    </div>

    <div class="flex-1 pt-2">
      <RouterView v-slot="{ Component }">
        <Transition 
          name="page" 
          mode="out-in" 
          enter-active-class="animate-enter" 
          leave-active-class="animate-leave"
        >
          <component :is="Component" />
        </Transition>
      </RouterView>
    </div>
  </div>
</template>

