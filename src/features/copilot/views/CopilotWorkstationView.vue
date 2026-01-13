<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue';
import { 
  Bot, User, Send, Cpu, Search, FileText, 
  Loader2, CheckCircle2, AlertCircle, 
  Database, UploadCloud, ChevronRight
} from 'lucide-vue-next';

// Import API ที่สร้างไว้ (ตรวจสอบ path ให้ตรงกับเครื่องคุณ)
import { copilotApi, type CopilotEvent } from '@/features/copilot/api';

// --- Types ---
interface Message {
  id: number;
  role: 'user' | 'agent';
  text: string;
  actionHtml?: string;
}

interface TraceStep {
  id: number;
  title: string;
  desc: string;
  status: 'pending' | 'active' | 'completed';
  relatedFileId?: string; // Link to center pane
}

interface FileAsset {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'table';
  size: string;
  status: 'synced' | 'processing';
}

// --- State ---
const userInput = ref('');
const isTyping = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const agentStatus = ref<'IDLE' | 'PROCESSING' | 'WAITING'>('IDLE');
const activeAssetTab = ref<'docs' | 'tables'>('docs');

// Chat Data
const messages = ref<Message[]>([
  { 
    id: 1, 
    role: 'agent', 
    text: 'สวัสดีครับ ผมคือ AI ผู้ช่วยตรวจสอบ (Audit Co-pilot) พร้อมเริ่มงานครับ' 
  }
]);

// Trace Data
const traceSteps = ref<TraceStep[]>([]);

// Assets Data (Center Bottom)
const files = reactive<FileAsset[]>([
  { id: 'doc_1', name: 'Procurement_Policy_2024_v3.pdf', type: 'pdf', size: '2.4 MB', status: 'synced' },
  { id: 'doc_2', name: 'Vendor_SLA_Appendix_B.docx', type: 'docx', size: '540 KB', status: 'synced' },
  { id: 'tbl_1', name: 'public.po_headers', type: 'table', size: '14k rows', status: 'synced' },
]);

// Center Viewer State
const activeFileId = ref<string>('doc_1');
const showHighlight = ref(false);
const highlightedText = ref('');
const matchScore = ref(0);

// --- Actions ---
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const formatText = (text: string) => {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>');
};

// ---------------------------------------------------------
// REAL API INTEGRATION
// ---------------------------------------------------------
const sendMessage = async (overrideText?: string) => {
  const query = overrideText || userInput.value;
  if (!query.trim()) return;

  // 1. Setup UI State
  messages.value.push({ id: Date.now(), role: 'user', text: query });
  userInput.value = '';
  isTyping.value = true;
  agentStatus.value = 'PROCESSING';
  showHighlight.value = false; // Reset highlight

  // Prepare Empty Agent Bubble
  const aiMsgId = Date.now() + 1;
  messages.value.push({ id: aiMsgId, role: 'agent', text: '' });
  scrollToBottom();

  try {
    // 2. Call Streaming API
    await copilotApi.streamChat(
      { 
        case_id: 'CASE-PO-2026-1057', // Hardcoded or from Route params
        query: query 
      }, 
      (event: CopilotEvent) => {
        // --- Event Handler Switch ---
        switch (event.type) {
          
          case 'trace':
            // Update Workflow Steps (Right Panel)
            handleTraceEvent(event.data);
            break;

          case 'evidence_reveal':
            // Trigger Document Viewer (Center Panel)
            handleEvidenceEvent(event.data);
            break;

          case 'message_chunk':
            // Stream Text (Left Panel)
            const aiMsg = messages.value.find(m => m.id === aiMsgId);
            if (aiMsg) {
              aiMsg.text += (event.data.text || '');
              scrollToBottom();
            }
            break;

          case 'error':
            console.error('Stream Error:', event.data);
            break;
        }
      }
    );

  } catch (e) {
    console.error('Chat Failed', e);
    const aiMsg = messages.value.find(m => m.id === aiMsgId);
    if (aiMsg) aiMsg.text += "\n[System Error: Connection failed]";
  } finally {
    isTyping.value = false;
    agentStatus.value = 'IDLE';
  }
};

// Helper: Update Trace List
const handleTraceEvent = (data: any) => {
  const existingStep = traceSteps.value.find(s => s.id === data.step_id);
  
  if (existingStep) {
    // Update existing
    existingStep.title = data.title;
    existingStep.desc = data.desc;
    existingStep.status = data.status;
  } else {
    // Add new step
    traceSteps.value.push({
      id: data.step_id,
      title: data.title,
      desc: data.desc,
      status: data.status,
      relatedFileId: data.related_file_id // Optional link
    });
  }
};

// Helper: Show Evidence
const handleEvidenceEvent = (data: any) => {
  // 1. Switch File
  if (data.file_id) {
    activeFileId.value = data.file_id;
  }
  
  // 2. Set Highlight Data
  if (data.highlight_text) {
    highlightedText.value = data.highlight_text;
    matchScore.value = data.score || 95;
    
    // Delay animation slightly for visual effect
    setTimeout(() => {
      showHighlight.value = true;
    }, 500);
  }
};

</script>

<template>
  <div class="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50 font-sans text-slate-800">
    
    <aside class="flex w-[22%] min-w-[300px] flex-col border-r border-slate-200 bg-white z-10">
      <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Bot class="w-4 h-4 text-primary"/> Chat Context
        </span>
        <span class="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
      </div>

      <div ref="chatContainer" class="flex-1 space-y-5 overflow-y-auto p-4 custom-scrollbar">
        <div v-for="msg in messages" :key="msg.id" class="flex gap-3 animate-slide-in" :class="msg.role === 'user' ? 'flex-row-reverse' : ''">
          
          <div 
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
            :class="msg.role === 'agent' ? 'bg-gradient-to-br from-red-600 to-red-700' : 'bg-slate-600'"
          >
            <Bot v-if="msg.role === 'agent'" class="h-5 w-5" />
            <User v-else class="h-5 w-5" />
          </div>

          <div class="max-w-[85%] space-y-1">
            <div 
              class="rounded-2xl p-3 text-sm leading-relaxed shadow-sm"
              :class="msg.role === 'agent' ? 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200' : 'bg-primary text-white rounded-tr-none'"
            >
              <div v-html="formatText(msg.text)"></div>
            </div>

            <div v-if="msg.actionHtml === 'DRAFT_EMAIL'" class="mt-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm animate-enter">
              <div class="mb-2 border-b border-slate-100 pb-2 text-xs font-bold text-slate-500">Suggested Action</div>
              <div class="text-xs text-slate-600">Draft negotiation email to TechSpace...</div>
              <div class="mt-3 flex gap-2">
                <button class="flex-1 rounded bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition">View Draft</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isTyping" class="flex gap-3 animate-slide-in">
           <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-700 text-white shadow-sm">
             <Bot class="h-5 w-5" />
           </div>
           <div class="flex h-10 items-center gap-1 rounded-2xl rounded-tl-none border border-slate-200 bg-slate-100 px-4">
              <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 delay-75"></span>
              <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 delay-150"></span>
              <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 delay-300"></span>
           </div>
        </div>
      </div>

      <div class="border-t border-slate-200 p-4 bg-white">
        <div class="relative">
          <input 
            v-model="userInput" 
            @keyup.enter="() => sendMessage()"
            type="text" 
            placeholder="Ask about price, contract, or risk..." 
            class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
          >
          <button 
            @click="() => sendMessage()"
            class="absolute right-2 top-2 rounded-lg p-1 text-primary hover:bg-red-50 transition"
          >
            <Send class="h-4 w-4" />
          </button>
        </div>
        <div v-if="messages.length === 1" class="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button 
            @click="sendMessage('ช่วยตรวจสอบราคา Server Rack 42U ของเจ้า TechSpace ให้หน่อยครับ ว่าแพงกว่าสัญญาไหม?')" 
            class="flex items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-medium text-slate-600 hover:border-primary hover:text-primary transition shadow-sm"
          >
            <Search class="h-3 w-3" /> Check Price vs Contract
          </button>
        </div>
      </div>
    </aside>

    <main class="flex flex-1 flex-col border-r border-slate-200 bg-slate-100 relative">
      
      <div class="relative flex h-[55%] flex-col border-b-4 border-slate-200 bg-slate-200">
        <div class="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm z-10">
          <div class="flex items-center gap-2">
            <FileText class="h-4 w-4 text-slate-500"/>
            <span class="text-xs font-bold text-slate-700">
              {{ files.find(f => f.id === activeFileId)?.name || 'Select a document' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
             <span v-if="showHighlight" class="flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 animate-enter">
               <Search class="h-3 w-3"/> Found Match
             </span>
             <span class="rounded bg-slate-100 px-2 py-1 text-[10px] font-mono text-slate-500 border border-slate-200">Page 12 / 45</span>
          </div>
        </div>

        <div class="flex flex-1 items-start justify-center overflow-y-auto p-8 custom-scrollbar relative">
          <div class="relative min-h-[800px] w-[550px] bg-white p-10 shadow-lg transition-all duration-500">
            <div class="space-y-4 opacity-30">
              <div class="h-3 w-1/3 bg-slate-800 mb-8"></div>
              <div class="h-2 w-full bg-slate-800"></div>
              <div class="h-2 w-full bg-slate-800"></div>
              <div class="h-2 w-5/6 bg-slate-800"></div>
              <br>
              <div class="h-2 w-full bg-slate-800"></div>
              <div class="h-2 w-full bg-slate-800"></div>
            </div>

            <div 
              class="absolute left-8 right-8 top-32 rounded border-2 border-dashed border-primary/50 bg-yellow-100/40 p-3 transition-all duration-700"
              :class="showHighlight ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'"
            >
              <div class="absolute -right-3 -top-3 flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                Match {{ matchScore }}%
              </div>
              
              <div v-if="highlightedText">
                 <p class="font-sans text-xs font-medium text-slate-900 leading-relaxed">
                   {{ highlightedText }}
                 </p>
              </div>
              <div v-else>
                 <p class="font-sans text-xs font-medium text-slate-900 leading-relaxed">
                   "4.1 The agreed unit price for <strong class="bg-yellow-300">Server Rack 42U shall be fixed at 32,000 THB</strong> for the duration of 12 months."
                 </p>
              </div>
            </div>

            <div class="space-y-4 opacity-30 mt-8">
               <div class="h-2 w-full bg-slate-800"></div>
               <div class="h-2 w-4/5 bg-slate-800"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-1 flex-col bg-white">
        <div class="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button 
            @click="activeAssetTab = 'docs'"
            class="group flex items-center gap-2 rounded-t-lg border-t border-l border-r px-4 py-2 text-xs font-bold transition-all"
            :class="activeAssetTab === 'docs' ? 'bg-white border-slate-200 text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'"
          >
            <UploadCloud class="h-3 w-3" /> Documents (RAG)
          </button>
          <button 
            @click="activeAssetTab = 'tables'"
            class="group flex items-center gap-2 rounded-t-lg border-t border-l border-r px-4 py-2 text-xs font-bold transition-all"
            :class="activeAssetTab === 'tables' ? 'bg-white border-slate-200 text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'"
          >
            <Database class="h-3 w-3" /> Relational Tables
          </button>
        </div>

        <div class="flex-1 overflow-auto p-0">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th class="p-3 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">Status</th>
                <th class="p-3 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">Name</th>
                <th class="p-3 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 text-right">Size</th>
              </tr>
            </thead>
            <tbody class="text-xs text-slate-700">
              <tr 
                v-for="file in files" 
                :key="file.id" 
                class="hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100"
                :class="activeFileId === file.id ? 'bg-indigo-50/50' : ''"
                @click="activeFileId = file.id"
              >
                <td class="p-3">
                  <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                    <CheckCircle2 class="h-3 w-3"/> Synced
                  </span>
                </td>
                <td class="p-3 font-medium flex items-center gap-2">
                  <FileText v-if="file.type !== 'table'" class="h-4 w-4 text-slate-400"/>
                  <Database v-else class="h-4 w-4 text-slate-400"/>
                  {{ file.name }}
                </td>
                <td class="p-3 text-right font-mono text-slate-500">{{ file.size }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <aside class="flex w-[20%] min-w-[260px] flex-col border-l border-slate-200 bg-slate-50">
      <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Cpu class="w-4 h-4 text-primary"/> Workflow Trace
        </span>
        <span 
          class="text-[10px] font-mono font-bold transition-colors"
          :class="agentStatus === 'PROCESSING' ? 'text-primary animate-pulse' : 'text-slate-400'"
        >
          {{ agentStatus }}
        </span>
      </div>

      <div class="flex-1 overflow-y-auto p-5 custom-scrollbar relative">
        <div class="absolute left-[29px] top-6 bottom-0 w-0.5 bg-slate-200 z-0"></div>

        <div class="space-y-6 relative z-10">
          <div 
            v-for="step in traceSteps" 
            :key="step.id" 
            class="group relative pl-8 animate-slide-in"
          >
            <div 
              class="absolute left-0 top-1 h-3 w-3 rounded-full border-2 transition-all duration-300 shadow-sm"
              :class="[
                step.status === 'active' ? 'bg-white border-primary scale-125 ring-2 ring-primary/20' : 
                step.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-200 border-slate-300'
              ]"
            ></div>

            <div>
               <div class="flex items-center justify-between">
                 <h4 
                   class="text-xs font-bold transition-colors"
                   :class="step.status === 'active' ? 'text-primary' : 'text-slate-700'"
                 >
                   {{ step.title }}
                 </h4>
                 <Loader2 v-if="step.status === 'active'" class="h-3 w-3 animate-spin text-primary"/>
               </div>
               
               <p class="mt-1 text-[10px] font-medium text-slate-500 leading-normal">
                 {{ step.desc }}
               </p>

               <div v-if="step.relatedFileId" class="mt-2 flex">
                 <button class="flex items-center gap-1 rounded border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100 transition">
                   <FileText class="h-3 w-3"/> View Source
                 </button>
               </div>
            </div>
          </div>
        </div>
        
        <div v-if="traceSteps.length === 0" class="flex h-40 flex-col items-center justify-center text-center opacity-40">
           <Cpu class="h-8 w-8 text-slate-400 mb-2"/>
           <p class="text-[10px] text-slate-500">Waiting for input...</p>
        </div>

      </div>
    </aside>

  </div>
</template>

<style scoped>
/* Enterprise Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* Animations */
.animate-slide-in {
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(10px);
}

.animate-enter {
  animation: enter 0.4s ease-out forwards;
}

@keyframes slideIn {
  to { opacity: 1; transform: translateY(0); }
}

@keyframes enter {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>