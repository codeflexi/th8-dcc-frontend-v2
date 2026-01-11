<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { http } from '@/lib/http'; 

const router = useRouter();
const isLoading = ref(false);

const stats = ref({ total_exposure: 0, high_risk_count: 0, open_cases: 0 });
const items = ref<any[]>([]);
const pagination = ref({ total: 0, pages: 1 });

const filters = ref({
  page: 1,
  size: 10,
  search: '',
  risk: 'ALL'
});

const fetchData = async () => {
  isLoading.value = true;
  try {
    // 1. Get Stats
    stats.value = await http.get('/api/cases/stats');
    
    // 2. Get Cases
    const params = new URLSearchParams();
    params.append('page', filters.value.page.toString());
    params.append('size', filters.value.size.toString());
    if (filters.value.search) params.append('search', filters.value.search);
    if (filters.value.risk !== 'ALL') params.append('risk', filters.value.risk);
    
    const res = await http.get(`/api/cases?${params.toString()}`);
    
    // ✅ FIX: Data Mapping Layer
    // แปลง Key จาก Backend (vendor_id, amount_total) ให้ตรงกับที่ UI ใช้ (vendor, amount)
    items.value = (res.items || []).map((item: any) => ({
      ...item,
      // ถ้า Backend ส่ง vendor_id มา ให้ใช้ vendor_id, ถ้าไม่มีให้ลอง vendor
      vendor: item.vendor_id || item.vendor || 'Unknown Vendor',
      // ถ้า Backend ส่ง amount_total มา ให้ใช้ amount_total
      amount: item.amount_total !== undefined ? item.amount_total : (item.amount || 0)
    }));

    pagination.value = { total: res.total, pages: res.pages };
    
  } catch (e) {
    console.error("Failed to fetch cases:", e);
  } finally {
    isLoading.value = false;
  }
};

const navigateToDetail = (id: string) => {
  router.push(`/cases/${id}`);
};

watch(() => filters.value, () => fetchData(), { deep: true });
onMounted(() => fetchData());

const formatCurrency = (val: number) => {
    // ป้องกัน NaN/Undefined แสดงเป็น 0 แทน
    if (val === undefined || val === null || isNaN(val)) return '0';
    return new Intl.NumberFormat('th-TH').format(val);
};

const getRiskClass = (level: string) => {
  if (!level) return 'bg-slate-50 text-slate-500';
  switch(level.toUpperCase()) {
    case 'HIGH': return 'bg-red-50 text-red-700 border-red-100';
    case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'LOW': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    default: return 'bg-slate-50 text-slate-500';
  }
};
</script>

<template>
  <div class="space-y-6 animate-enter">
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <p class="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Exposure</p>
          <p class="text-xl font-mono font-bold text-slate-900">THB {{ formatCurrency(stats.total_exposure) }}</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
          <span class="material-icons-outlined">payments</span>
        </div>
      </div>
      
      <div class="bg-white p-5 rounded-xl border border-red-100 bg-red-50/30 shadow-sm flex justify-between items-center">
        <div>
          <p class="text-[10px] uppercase font-bold text-red-500 mb-1">High Risk Cases</p>
          <p class="text-xl font-mono font-bold text-red-600">{{ stats.high_risk_count }}</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <span class="material-icons-outlined">warning</span>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <p class="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Backlog</p>
          <p class="text-xl font-mono font-bold text-slate-900">{{ stats.open_cases }}</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <span class="material-icons-outlined">folder_open</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
       <div class="flex gap-4 w-full md:w-auto">
          <div class="relative flex-1 md:w-64">
             <span class="absolute left-3 top-2.5 material-icons-outlined text-slate-400 text-sm">search</span>
             <input v-model.lazy="filters.search" 
                    placeholder="Search ID, Vendor..." 
                    class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-primary transition" />
          </div>
          <select v-model="filters.risk" class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white cursor-pointer">
             <option value="ALL">All Risks</option>
             <option value="HIGH">High Risk</option>
             <option value="MEDIUM">Medium Risk</option>
             <option value="LOW">Low Risk</option>
          </select>
       </div>
       <button @click="$router.push('/cases/new')" 
               class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-red-700 transition flex items-center gap-2">
          <span class="material-icons-outlined text-sm">add</span> New Case
       </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div v-if="isLoading" class="p-8 space-y-4">
         <div v-for="i in 5" :key="i" class="h-12 bg-slate-50 rounded animate-pulse"></div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead class="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th class="px-6 py-3">Case ID</th>
              <th class="px-6 py-3">Vendor</th>
              <th class="px-6 py-3 text-right">Amount</th>
              <th class="px-6 py-3 text-center">Status</th>
              <th class="px-6 py-3 text-center">Risk</th>
              <th class="px-6 py-3 text-center">Created</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50 transition group">
              <td class="px-6 py-4 font-mono text-xs font-bold text-slate-700 group-hover:text-primary transition-colors">
                  {{ item.id }}
              </td>
              
              <td class="px-6 py-4 text-slate-700 font-medium">
                  {{ item.vendor }}
              </td>
              
              <td class="px-6 py-4 text-right font-mono">
                  {{ formatCurrency(item.amount) }}
              </td>
              
              <td class="px-6 py-4 text-center">
                 <span class="px-2 py-1 rounded text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-100 uppercase">
                    {{ item.status }}
                 </span>
              </td>
              <td class="px-6 py-4 text-center">
                 <span class="px-2 py-1 rounded text-[10px] font-bold border min-w-[60px] inline-block uppercase"
                       :class="getRiskClass(item.risk_level)">
                    {{ item.risk_level || 'LOW' }}
                 </span>
              </td>
              <td class="px-6 py-4 text-center text-xs text-slate-400">
                 {{ new Date(item.created_at).toLocaleDateString('en-GB') }}
              </td>
              <td class="px-6 py-4 text-right">
                 <button @click="navigateToDetail(item.id)" 
                         class="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded hover:text-primary hover:border-primary transition shadow-sm">
                    Manage
                 </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="items.length === 0" class="p-10 text-center text-slate-400 flex flex-col items-center">
           <span class="material-icons-outlined text-4xl mb-2 opacity-50">search_off</span>
           <p>No cases found matching criteria.</p>
        </div>
      </div>

      <div class="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center" v-if="items.length > 0 || filters.page > 1">
         <span class="text-xs text-slate-500">
            Page {{ filters.page }} of {{ pagination.pages }} (Total {{ pagination.total }})
         </span>
         <div class="flex gap-2">
            <button :disabled="filters.page === 1" 
                    @click="filters.page--" 
                    class="px-3 py-1 bg-white border border-slate-200 rounded text-xs hover:bg-slate-100 disabled:opacity-50 transition">
               Prev
            </button>
            <button :disabled="filters.page === pagination.pages" 
                    @click="filters.page++" 
                    class="px-3 py-1 bg-white border border-slate-200 rounded text-xs hover:bg-slate-100 disabled:opacity-50 transition">
               Next
            </button>
         </div>
      </div>
    </div>

  </div>
</template>