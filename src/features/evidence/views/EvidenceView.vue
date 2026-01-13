<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';

// ✅ 1. Import API และ Types
import { copilotApi, type CopilotEvent } from '@/features/evidence/ api_copilot';
import type { EvidenceItem } from '@/features/evidence/types'; 
import { caseApi } from '@/features/cases/api';

// ✅ 2. รับ Props เพื่อใช้เช็ค Rule Results
const props = defineProps<{
  caseData?: any
}>();

// --- Local Types ---
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

// --- State ---
const route = useRoute();
const caseId = (route.params.caseId as string) || props.caseData?.case_id || 'CASE-PO-2026-5286';

// Split Pane State
const containerRef = ref<HTMLElement | null>(null);
const leftPanelWidth = ref(400);
const isDragging = ref(false);

// Chat & Data State
const query = ref('');
const messages = ref<ChatMessage[]>([
  {
    id: 'intro',
    role: 'assistant',
    text: `สวัสดีครับ ผมพร้อมให้ข้อมูลเกี่ยวกับเคส ${caseId} และตรวจสอบเอกสารที่เกี่ยวข้องครับ`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
]);
const evidenceList = ref<EvidenceItem[]>([]); 
const activeDoc = ref<EvidenceItem | null>(null);
const isLoading = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const workflowStatus = ref<string>('Ready'); 

// --- ✅ NEW: Auto-Trigger Evidence Search Logic ---
const triggerAutoContext = async () => {
  const payload = props.caseData?.payload;
  
  // ตรวจสอบว่ามี Rule เรื่องราคา (CONTRACT_PRICE_VARIANCE) ที่ Matched หรือไม่
  const hasPriceVariance = payload?.last_rule_results?.some(
    (r: any) => r.rule_id === 'CONTRACT_PRICE_VARIANCE' && r.hit
  );

  if (hasPriceVariance) {
    const vendor = payload?.vendor_name || '';
    const sku = payload?.line_items?.[0]?.sku || '';
    const autoQuery = `ตรวจสอบราคาสินค้า ${sku} ในสัญญาของ vendor ${vendor}`;
    
    isLoading.value = true;
    workflowStatus.value = 'Analyzing Contract...';
    
    try {
      await copilotApi.streamChat(
        { case_id: caseId, query: autoQuery },
        (event) => {
          // ส่ง 'auto' เพื่อให้ handleStreamEvent รู้ว่าไม่ต้องเอาข้อความลง Chat box
          handleStreamEvent(event, 'auto'); 
        }
      );
    } catch (err) {
      console.error("Auto Search Error:", err);
    } finally {
      isLoading.value = false;
      workflowStatus.value = 'Ready';
    }
  }
};

// 1. เพิ่มฟังก์ชันสำหรับเช็คกฎและสั่งค้นหาอัตโนมัติ
const initAutoSearch = async () => {
  try {
    // ดึงข้อมูลเคสมาเช็คว่าติดกฎเรื่องราคาไหม
    const caseDetail = await caseApi.getById(caseId);
    const results = caseDetail?.payload?.last_rule_results || [];
    
    // ถ้าเจอว่าราคาผิดปกติ (Rule Hit)
    if (results.some((r: any) => r.rule_id === 'CONTRACT_PRICE_VARIANCE' && r.hit)) {
      const payload = caseDetail.payload;
      const autoQuery = `ตรวจสอบราคา ${payload.line_items?.[0]?.sku} ของ ${payload.vendor_name}`;
      
      isLoading.value = true;
      // สั่ง AI ค้นหาเบื้องหลัง (ไม่โชว์ข้อความใน Chat)
      await copilotApi.streamChat(
        { case_id: caseId, query: autoQuery },
        (event) => handleStreamEvent(event, 'auto') // 'auto' จะทำให้ไม่ขึ้นข้อความในแชท
      );
    }
  } catch (err) {
    console.error("Auto Search Error:", err);
  } finally {
    isLoading.value = false;
  }
};

// --- Initialization ---
onMounted(() => {
  if (containerRef.value) {
    leftPanelWidth.value = containerRef.value.clientWidth * 0.4;
  }
  // ✅ เรียกฟังก์ชันดึงบริบทอัตโนมัติเมื่อโหลดหน้า
  if (props.caseData) {
    triggerAutoContext();
  }
});

// --- Resizer Logic ---
const startResize = () => {
  isDragging.value = true;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopResize);
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !containerRef.value) return;
  const containerRect = containerRef.value.getBoundingClientRect();
  const newWidth = e.clientX - containerRect.left;
  if (newWidth > 320 && newWidth < containerRect.width * 0.7) {
    leftPanelWidth.value = newWidth;
  }
};

const stopResize = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
};

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
});

// --- Helper: Scroll Chat ---
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

// --- API Connection Logic ---
const handleSend = async () => {
  const userText = query.value.trim();
  if (!userText) return;

  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    text: userText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  query.value = '';
  isLoading.value = true;
  scrollToBottom();

  const aiMsgId = Date.now().toString() + '_ai';
  messages.value.push({
    id: aiMsgId,
    role: 'assistant',
    text: '',
    timestamp: 'Thinking...',
    isStreaming: true
  });
  
  try {
    await copilotApi.streamChat(
      { case_id: caseId, query: userText },
      (event) => handleStreamEvent(event, aiMsgId) 
    );
  } catch (err) {
    console.error("Chat Error:", err);
  } finally {
    isLoading.value = false;
    const aiMsg = messages.value.find(m => m.id === aiMsgId);
    if (aiMsg) {
      aiMsg.isStreaming = false;
      aiMsg.timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
};

// --- Event Handler ---
const handleStreamEvent = (event: CopilotEvent, aiMsgId: string) => {
  const aiMsg = messages.value.find(m => m.id === aiMsgId);
  
  switch (event.type) {
    case 'trace':
      workflowStatus.value = event.data.desc || event.data.title;
      break;

    case 'evidence_reveal':
      const newEvidence: EvidenceItem = {
        id: event.data.file_id || `doc-${Date.now()}`,
        docId: event.data.file_name,
        docTitle: event.data.file_name,
        content: event.data.highlight_text,
        score: event.data.score || 0,
        matchType: 'SEMANTIC'
      };
      
      if (!evidenceList.value.some(e => e.content === newEvidence.content)) {
        evidenceList.value.push(newEvidence);
      }
      
      if (!activeDoc.value) {
        activeDoc.value = newEvidence;
      }
      break;

    case 'message_chunk':
      // ✅ ไม่แสดงข้อความในแชทหากเป็นการรันแบบเบื้องหลัง (Auto)
      if (aiMsg && aiMsgId !== 'auto') {
        aiMsg.text += event.data.text;
        scrollToBottom();
      }
      break;
      
    case 'error':
      if (aiMsg && aiMsgId !== 'auto') aiMsg.text += `\n[System Error: ${event.data.message}]`;
      break;
  }
};
</script>

<template>
  <div class="absolute inset-0 overflow-y-auto bg-slate-50 scroll-smooth">
    <div ref="containerRef" class="flex h-full w-full bg-slate-100 overflow-hidden font-sans relative select-none">
      
      <div 
        class="flex flex-col bg-white shadow-sm z-10 shrink-0 border-r border-slate-200/60"
        :style="{ width: leftPanelWidth + 'px' }"
      >
        <div class="h-14 border-b border-slate-100 flex items-center px-4 justify-between bg-white shrink-0">
          <div class="flex items-center gap-3">
             <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary relative">
               <span class="material-icons-outlined text-lg">smart_toy</span>
               <span v-if="isLoading" class="absolute -right-1 -top-1 flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
               </span>
             </div>
             <div>
               <h2 class="font-bold text-slate-800 text-sm">Case Copilot</h2>
               <p class="text-[10px] text-slate-500 font-mono tracking-tight truncate max-w-[150px]">
                 {{ isLoading ? workflowStatus : caseId }}
               </p>
             </div>
          </div>
          <button class="p-1.5 text-slate-400 hover:text-primary hover:bg-red-50 rounded-full transition">
             <span class="material-icons-outlined text-lg">history</span>
          </button>
        </div>
  
        <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth bg-slate-50/30">
          <div v-for="msg in messages" :key="msg.id" class="flex gap-3 animate-enter">
            <div class="shrink-0 mt-1">
               <div v-if="msg.role === 'assistant'" class="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-sm ring-2 ring-white">
                  <span class="material-icons-outlined text-xs">auto_awesome</span>
               </div>
               <div v-else class="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 ring-2 ring-white">
                  <span class="material-icons-outlined text-xs">person</span>
               </div>
            </div>
            <div class="flex-1 space-y-1 min-w-0">
               <div class="flex items-baseline gap-2">
                  <span class="text-xs font-bold text-slate-700">{{ msg.role === 'assistant' ? 'Copilot' : 'You' }}</span>
                  <span class="text-[10px] text-slate-400">{{ msg.timestamp }}</span>
               </div>
               <div 
                 class="text-sm leading-relaxed p-3 rounded-2xl shadow-sm border whitespace-pre-line break-words"
                 :class="msg.role === 'assistant' ? 'bg-white border-slate-200 text-slate-700 rounded-tl-none' : 'bg-slate-800 border-transparent text-white rounded-tr-none'"
               >
                  {{ msg.text }}
                  <span v-if="msg.isStreaming" class="inline-block w-1.5 h-3 bg-slate-400 animate-pulse ml-1 align-middle"></span>
               </div>
            </div>
          </div>
        </div>
  
        <div class="h-[240px] border-t border-slate-200 bg-white flex flex-col shrink-0">
           <div class="px-4 py-2 flex justify-between items-center bg-slate-50 border-b border-slate-100">
              <h3 class="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                 <span class="material-icons-outlined text-sm">find_in_page</span>
                 Context
              </h3>
              <span class="text-[10px] text-slate-400 bg-white border px-1.5 rounded">{{ evidenceList.length }} refs</span>
           </div>
           <div class="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
              <div v-if="evidenceList.length === 0" class="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                 <span class="text-xs">Waiting for search...</span>
              </div>
              <div 
                v-for="item in evidenceList" :key="item.id"
                @click="activeDoc = item"
                class="bg-white border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all relative group"
                :class="activeDoc?.id === item.id ? 'border-primary ring-1 ring-primary/10 shadow-sm' : 'border-slate-200'"
              >
                 <div v-if="activeDoc?.id === item.id" class="absolute left-0 top-3 bottom-3 w-0.5 bg-primary rounded-r"></div>
                 <div class="flex items-center gap-2 mb-1">
                    <span class="material-icons-outlined text-red-500 text-sm">picture_as_pdf</span>
                    <span class="text-xs font-bold text-slate-700 truncate group-hover:text-primary transition-colors">{{ item.docTitle }}</span>
                 </div>
                 <p class="text-[11px] text-slate-500 line-clamp-2 pl-6 ml-1">
                    {{ item.content }}
                 </p>
                 <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                      {{ (item.score * 100).toFixed(0) }}% Match
                    </span>
                 </div>
              </div>
           </div>
        </div>
  
        <div class="p-3 bg-white border-t border-slate-200 shrink-0 z-20">
           <div class="relative">
              <input 
                 v-model="query" @keydown.enter="handleSend"
                 :disabled="isLoading"
                 class="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition shadow-inner disabled:bg-slate-50 disabled:cursor-wait"
                 placeholder="Ask Copilot..."
              />
              <button 
                 @click="handleSend" :disabled="!query || isLoading"
                 class="absolute right-1.5 top-1.5 p-1.5 bg-primary text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
              >
                 <span v-if="isLoading" class="material-icons-outlined text-xs animate-spin">refresh</span>
                 <span v-else class="material-icons-outlined text-xs block">send</span>
              </button>
           </div>
        </div>
      </div>
  
      <div 
        class="w-4 bg-slate-100 flex items-center justify-center cursor-col-resize z-20 shrink-0 hover:bg-slate-200 transition-colors group border-r border-slate-200/50"
        @mousedown.prevent="startResize"
      >
         <div class="h-8 w-1 bg-slate-300 rounded-full group-hover:bg-primary group-hover:scale-y-125 transition-all duration-200 shadow-sm"></div>
      </div>
  
      <div class="flex-1 bg-slate-50 flex flex-col relative overflow-hidden min-w-0">
        <div class="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm shrink-0 z-10">
           <div class="flex items-center gap-3">
              <div class="p-1.5 bg-red-50 text-red-600 rounded-lg border border-red-100">
                 <span class="material-icons-outlined text-lg">description</span>
              </div>
              <div>
                 <h3 class="text-sm font-bold text-slate-800">{{ activeDoc?.docTitle || 'Document Viewer' }}</h3>
                 <p class="text-[10px] text-slate-400">
                    {{ activeDoc ? 'Viewing referenced page' : 'Select evidence from context to view' }}
                 </p>
              </div>
           </div>
        </div>
  
        <div class="flex-1 overflow-auto p-8 flex justify-center bg-slate-100/50">
           <div v-if="activeDoc" class="relative bg-white shadow-xl border border-slate-200 w-[650px] min-h-[920px] animate-enter">
              <div class="p-12 space-y-6 opacity-40 select-none pointer-events-none grayscale">
                 <div class="h-6 w-2/3 bg-slate-700 mb-8"></div>
                 <div v-for="n in 20" :key="n" class="h-2 w-full bg-slate-300"></div>
              </div>
              <div class="absolute top-[35%] left-[10%] right-[10%] p-2 border-2 border-primary/60 bg-yellow-300/20 rounded shadow-sm backdrop-blur-[1px]">
                 <div class="absolute -top-6 right-0 bg-primary text-white text-[10px] px-2 py-0.5 rounded shadow-sm font-bold flex items-center gap-1">
                    <span class="material-icons-outlined text-[10px]">auto_awesome</span> Match
                 </div>
                 <p class="text-sm font-serif text-slate-900 leading-relaxed whitespace-pre-wrap">{{ activeDoc.content }}</p>
              </div>
           </div>
           <div v-else class="flex flex-col items-center justify-center text-slate-400 mt-32">
              <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
                 <span class="material-icons-outlined text-5xl opacity-20 text-slate-300">plagiarism</span>
              </div>
              <p class="font-medium text-slate-500">No document selected</p>
           </div>
        </div>
      </div>
  
      <div v-if="isDragging" class="fixed inset-0 z-50 cursor-col-resize bg-black/0"></div>
  
    </div>
  </div>
</template>

<style scoped>
.animate-enter { animation: enter 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>