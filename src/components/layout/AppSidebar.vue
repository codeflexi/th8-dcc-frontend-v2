<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

// ดึง Case ID จาก URL ปัจจุบัน
const currentCaseId = computed(() => {
  return route.params.caseId as string | undefined
})


// ใน <script setup> ของ AppSidebar.vue

const isActive = (path: string) => {
  // กรณี 1: หน้า Case Portfolio (ไม่มี ID)
  if (path === '/cases' && !currentCaseId.value) {
    return route.path === '/cases';
  }
  
  // กรณี 2: หน้า Decision Run (เป็นหน้า Default ของ Case)
  // เช็คว่า URL ตรงกันเป๊ะๆ หรือไม่ (เพื่อไม่ให้ Highlight ซ้อนกับ Evidence/Audit)
  if (currentCaseId.value && path === `/cases/${currentCaseId.value}`) {
    return route.path === path;
  }

  // กรณี 3: หน้าอื่นๆ (Evidence, Audit) ใช้ startsWith ตามปกติ
  return route.path.startsWith(path);
}

// สร้าง Nav Items แบบ Dynamic
const navItems = computed(() => [
  { group: 'Workspace', items: [
    { 
      name: 'Case Portfolio', 
      path: '/cases', 
      icon: 'folder_open',
      disabled: false 
    },
    { 
      name: 'Decision Run', 
      path: currentCaseId.value ? `/cases/${currentCaseId.value}` : '#', 
      icon: 'gavel', 
      disabled: !currentCaseId.value 
    }, 
    { 
      name: 'Evidence Trace', 
      path: currentCaseId.value ? `/cases/${currentCaseId.value}/evidence` : '#', 
      icon: 'fact_check', 
      disabled: !currentCaseId.value 
    },
  ]},
  { group: 'Compliance', items: [
    { 
      name: 'Audit Timeline', 
      path: currentCaseId.value ? `/cases/${currentCaseId.value}/audit` : '#', 
      icon: 'history', 
      disabled: !currentCaseId.value 
    },
    { name: 'System Control', path: '/system', icon: 'settings', disabled: false },
    // เพิ่มรายการนี้ต่อจาก Audit Timeline
{ 
  name: 'Policy Studio', 
  path: '/system/policy-editor', 
  icon: 'terminal',  // ไอคอนใหม่ดู Technical
  disabled: false 
},
{ 
  name: 'Copilot Workstation', 
  path: '/copilot', 
  icon: 'terminal',  // ไอคอนใหม่ดู Technical
  disabled: false 
},
  ]}
])
</script>

<template>
  <aside class="w-[260px] bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-20 text-slate-300 transition-all duration-300">
    <div class="p-6">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-red-900/50">
          TH8
        </div>
        <div>
          <h1 class="text-sm font-bold text-white leading-tight tracking-wide">Decision<br/>Control Center</h1>
        </div>
      </div>
      <p class="text-[10px] text-slate-500 mt-2 font-mono">v1.0.0 • Enterprise</p>
    </div>

    <div class="px-6 flex gap-2 mb-8">
       <button class="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 text-xs font-medium rounded border border-slate-700 transition">
         Load Demo
       </button>
      <button 
  @click="$router.push('/cases/new')" 
  class="flex-1 py-2 px-3 bg-primary text-white text-xs font-medium rounded hover:bg-red-700 transition shadow-lg shadow-red-900/20"
>
  New Case
</button>
    </div>

    <nav class="flex-1 px-4 space-y-8 overflow-y-auto">
      <div v-for="group in navItems" :key="group.group">
        <h3 class="px-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">
          {{ group.group }}
        </h3>
        <ul class="space-y-1">
          <li v-for="item in group.items" :key="item.name">
            <RouterLink 
              v-if="!item.disabled"
              :to="item.path"
              class="flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all duration-200"
              :class="isActive(item.path) 
                ? 'bg-primary text-white shadow-md translate-x-1' 
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'"
            >
              <span class="material-icons-outlined text-[18px]">{{ item.icon }}</span>
              {{ item.name }}
            </RouterLink>
            
            <div v-else class="flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-slate-700 cursor-not-allowed">
               <span class="material-icons-outlined text-[18px]">{{ item.icon }}</span>
               {{ item.name }}
            </div>
          </li>
        </ul>
      </div>
    </nav>

    <div class="p-4 border-t border-slate-800 bg-slate-950/30">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
          <span class="material-icons-outlined text-xs">person</span>
        </div>
        <div>
          <p class="text-xs font-bold text-slate-200">Admin User</p>
          <p class="text-[10px] text-slate-500">TH8.AI Internal</p>
        </div>
      </div>
    </div>
  </aside>
</template>