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
    
    items.value = (res.items || []).map((item: any) => ({
      ...item,
      vendor: item.vendor_id || item.vendor_name || item.vendor || 'Unknown Vendor',
      amount: item.amount_total !== undefined ? item.amount_total : item.amount || 0,
      risk_level: item.risk_level || item.payload?.risk_level || 'LOW',
      po_number: item.payload?.po_number || `PO-${new Date().getFullYear()}-${item.id.split('-').pop()}`,
      category: item.domain === 'procurement' ? 'IT Equipment' : 'General Service',
      sla_hours: Math.floor(Math.random() * 48) + 1
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
    if (val === undefined || val === null || isNaN(val)) return '0';
    return new Intl.NumberFormat('th-TH').format(val);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

const getRiskBadgeStyle = (level: string) => {
  if (!level) return 'bg-slate-100 text-slate-500 border-slate-200';
  switch (level.toUpperCase()) {
    case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-200 shadow-sm';
    case 'HIGH': return 'bg-red-50 text-red-700 border-red-100';
    case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'LOW': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    default: return 'bg-slate-50 text-slate-500 border-slate-200';
  }
};
</script>

<template>
  <div class="h-full w-full overflow-y-auto bg-slate-50">
    
    <div class="max-w-7xl mx-auto px-6 py-8 pb-20 animate-enter space-y-6">
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
      
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <p class="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Total Exposure</p>
          <div v-if="isLoading" class="h-8 w-40 bg-slate-200 rounded animate-pulse mt-1"></div>
          <p v-else class="text-2xl font-mono font-bold text-slate-900 tracking-tight">THB {{ formatCurrency(stats.total_exposure) }}</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
          <span class="material-icons-outlined">payments</span>
        </div>
      </div>
      
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center relative overflow-hidden">
        <div class="absolute right-0 top-0 w-1 h-full bg-rose-500"></div>
        <div>
          <p class="text-[10px] uppercase font-bold text-rose-500 mb-1 tracking-wider">High Risk Cases</p>
          <div v-if="isLoading" class="h-8 w-16 bg-slate-200 rounded animate-pulse mt-1"></div>
          <p v-else class="text-2xl font-mono font-bold text-slate-900">{{ stats.high_risk_count }}</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
          <span class="material-icons-outlined">warning</span>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <p class="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Decision Inbox</p>
          <div v-if="isLoading" class="h-8 w-16 bg-slate-200 rounded animate-pulse mt-1"></div>
          <p v-else class="text-2xl font-mono font-bold text-slate-900">{{ stats.open_cases }}</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <span class="material-icons-outlined">inbox</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
       <div class="relative w-full md:w-96 group">
           <span class="absolute left-3 top-3 material-icons-outlined text-slate-400 group-focus-within:text-slate-800 transition">search</span>
           <input v-model.lazy="filters.search" 
                  placeholder="Search Case ID / Vendor / PO..." 
                  class="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition placeholder:text-slate-400" />
       </div>

       <div class="flex gap-3 w-full md:w-auto">
          <select v-model="filters.risk" class="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:border-slate-400 cursor-pointer hover:bg-slate-50">
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          
          <button @click="$router.push('/cases/new')" 
               class="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-black hover:-translate-y-0.5 transition flex items-center gap-2">
             <span class="material-icons-outlined text-sm">add</span> New Case
          </button>
       </div>
    </div>

      <div class="flex justify-between items-center pt-4 border-t border-slate-100 shrink-0" v-if="items.length > 0">
         <span class="text-xs font-medium text-slate-400">
            Showing page {{ filters.page }} of {{ pagination.pages }}
         </span>
         <div class="flex gap-2">
            <button :disabled="filters.page === 1" 
                    @click="filters.page--" 
                    class="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm">
               Previous
            </button>
            <button :disabled="filters.page === pagination.pages" 
                    @click="filters.page++" 
                    class="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm">
               Next
            </button>
         </div>
      </div>

    <div class="space-y-4">
      
      <div v-if="isLoading" class="space-y-4">
         <div v-for="i in 5" :key="i" class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse">
            <div class="flex flex-col md:flex-row justify-between items-start gap-4">
              <div class="flex-1 w-full">
                 <div class="h-3 w-16 bg-slate-200 rounded mb-3"></div> <div class="h-7 w-3/4 md:w-1/3 bg-slate-200 rounded mb-3"></div> <div class="flex items-center gap-2 mb-4"> <div class="h-4 w-24 bg-slate-200 rounded"></div>
                    <div class="w-1 h-1 rounded-full bg-slate-200"></div>
                    <div class="h-4 w-20 bg-slate-200 rounded"></div>
                    <div class="w-1 h-1 rounded-full bg-slate-200"></div>
                    <div class="h-4 w-32 bg-slate-200 rounded"></div>
                 </div>
                 <div class="flex gap-2"> <div class="h-6 w-16 bg-slate-200 rounded"></div>
                    <div class="h-6 w-20 bg-slate-200 rounded"></div>
                    <div class="h-6 w-16 bg-slate-200 rounded"></div>
                 </div>
              </div>
              <div class="w-full md:w-auto flex flex-col items-start md:items-end mt-4 md:mt-0">
                 <div class="h-3 w-12 bg-slate-200 rounded mb-2"></div> <div class="h-8 w-40 bg-slate-200 rounded mb-3"></div> <div class="h-6 w-24 bg-slate-200 rounded"></div> </div>
            </div>
         </div>
      </div>

      <div v-else-if="items.length === 0" class="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
           <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <span class="material-icons-outlined text-3xl text-slate-400">search_off</span>
           </div>
           <h3 class="text-lg font-bold text-slate-900">No cases found</h3>
           <p class="text-slate-500 mt-1">Try adjusting your search or filters</p>
      </div>

      <div v-else v-for="item in items" :key="item.id" 
           @click="navigateToDetail(item.id)"
           class="group bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer relative">
        
        <div class="flex flex-col md:flex-row justify-between items-start gap-4">
          
          <div class="flex-1 min-w-0">
             <div class="flex items-center gap-2 mb-1">
                <span class="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">{{ item.id }}</span>
             </div>

             <h3 class="text-lg font-extrabold text-slate-900 mb-2 truncate group-hover:text-blue-700 transition-colors">
               {{ item.vendor }}
             </h3>

             <p class="text-sm text-slate-500 mb-4 flex items-center gap-2">
                <span class="font-mono text-slate-600">{{ item.po_number }}</span>
                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>{{ item.category }}</span>
                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>Created {{ formatDate(item.created_at) }}</span>
             </p>

             <div class="flex flex-wrap items-center gap-3">
                <span class="px-2.5 py-1 rounded text-[10px] font-extrabold uppercase border tracking-wide"
                      :class="getRiskBadgeStyle(item.risk_level)">
                    {{ item.risk_level }}
                </span>

                <span class="px-2.5 py-1 rounded text-[10px] font-bold uppercase border bg-white border-slate-200 text-slate-600 flex items-center gap-1">
                   Status: {{ item.status }}
                </span>

                <span class="px-2.5 py-1 rounded text-[10px] font-bold uppercase border bg-white border-slate-200 text-slate-600">
                   Req: COO
                </span>
             </div>
          </div>

          <div class="text-left md:text-right shrink-0">
             <div class="mb-3">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Amount</p>
                <div class="flex items-baseline justify-end gap-1">
                   <span class="text-sm font-bold text-slate-500">THB</span>
                   <span class="text-2xl font-mono font-bold text-slate-900">{{ formatCurrency(item.amount) }}</span>
                </div>
             </div>
             
             <div class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                <span class="material-icons-outlined text-[14px] text-slate-400">timer</span>
                SLA: {{ item.sla_hours }}h left
             </div>
          </div>

        </div>
      </div>

    </div>

    <div class="flex justify-between items-center pt-4 border-t border-slate-100 shrink-0" v-if="items.length > 0">
         <span class="text-xs font-medium text-slate-400">
            Showing page {{ filters.page }} of {{ pagination.pages }}
         </span>
         <div class="flex gap-2">
            <button :disabled="filters.page === 1" 
                    @click="filters.page--" 
                    class="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm">
               Previous
            </button>
            <button :disabled="filters.page === pagination.pages" 
                    @click="filters.page++" 
                    class="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm">
               Next
            </button>
         </div>
      </div>

  </div>
  </div>
</template>