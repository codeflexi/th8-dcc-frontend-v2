<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { 
  Bot, User, Send, Cpu, Search, FileText, 
  Loader2, CheckCircle2, AlertCircle 
} from 'lucide-vue-next';

// --- State ---
const userInput = ref('');
const isTyping = ref(false);
const chatContainer = ref<HTMLElement | null>(null);

interface Message {
  id: number;
  role: 'user' | 'agent';
  text: string;
  actionHtml?: string; // For custom buttons/forms
}

interface TraceStep {
  id: number;
  title: string;
  desc: string;
  status: 'pending' | 'active' | 'completed';
  evidence?: {
    file: string;
    match: number;
    textHtml: string;
  };
}

const messages = ref<Message[]>([
  { 
    id: 1, 
    role: 'agent', 
    text: 'สวัสดีครับ ผมคือ AI ผู้ช่วยตรวจสอบการจัดซื้อ (Procurement Agent) ท่านสามารถถามเรื่องราคาสินค้า, ตรวจสอบสัญญา หรือขอให้ช่วยวิเคราะห์ความเสี่ยงได้ครับ' 
  }
]);

const traceSteps = ref<TraceStep[]>([]);
const agentStatus = ref<'IDLE' | 'PROCESSING' | 'WAITING'>('IDLE');

// --- Actions ---
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const startDemo = async () => {
  if (isTyping.value) return;
  
  // 1. User Message
  const text = "ช่วยตรวจสอบราคา Server Rack 42U ของเจ้า TechSpace ให้หน่อยครับ ว่าแพงกว่าสัญญาไหม?";
  messages.value.push({ id: Date.now(), role: 'user', text });
  userInput.value = '';
  scrollToBottom();

  // 2. Start Processing
  isTyping.value = true;
  agentStatus.value = 'PROCESSING';
  
  // Step 1: Intent
  await wait(800);
  addTrace(1, "1. Intent Recognition", "User wants to: Check Price vs Contract", "active");
  
  // Step 2: SAP
  await wait(1500);
  updateTraceStatus(1, 'completed');
  addTrace(2, "2. Tool Execution: SAP Lookup", "Querying latest PR from TechSpace... Found Price: 35,000 THB", "active");

  // Step 3: RAG
  await wait(2000);
  updateTraceStatus(2, 'completed');
  addTrace(3, "3. Tool Execution: RAG Search", "Retrieving 'Master Contract TechSpace'...", "active", {
    file: 'Master_Contract_2024.pdf',
    match: 98,
    textHtml: `...agreement made on 1st Jan 2024...<br><strong>Section 4. Pricing Terms</strong><br>4.1 The agreed unit price for <span class="bg-yellow-500/30 text-yellow-200 border-b border-yellow-400">Server Rack 42U shall be fixed at <strong>32,000 THB</strong></span>...`
  });

  // Step 4: Logic
  await wait(2500);
  updateTraceStatus(3, 'completed');
  addTrace(4, "4. Logic & Reasoning", "Variance: +9.3% (Exceeds 5% limit). Conclusion: Overpriced.", "active");

  // Final Response
  await wait(1500);
  updateTraceStatus(4, 'completed');
  isTyping.value = false;
  agentStatus.value = 'WAITING';
  
  messages.value.push({
    id: Date.now(),
    role: 'agent',
    text: "จากการตรวจสอบพบว่าราคาที่ **TechSpace** เสนอมาคือ **35,000 บาท** ซึ่ง **สูงกว่า** ราคาสัญญา (32,000 บาท) อยู่ประมาณ **9.3%** ครับ ซึ่งเกินเกณฑ์ที่ระบุไว้ในสัญญาข้อ 4.2 ที่ให้ปรับขึ้นได้ไม่เกิน 5%"
  });
  
  // Action Response
  messages.value.push({
    id: Date.now() + 1,
    role: 'agent',
    text: "ผมได้ร่างอีเมลเพื่อต่อรองราคาให้กลับมาอยู่ในเกณฑ์สัญญาแล้วครับ ท่านต้องการปรับแก้ตรงไหนไหมครับ?",
    actionHtml: 'DRAFT_EMAIL'
  });
  scrollToBottom();
};

// --- Helpers ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const addTrace = (id: number, title: string, desc: string, status: TraceStep['status'], evidence?: any) => {
  traceSteps.value.push({ id, title, desc, status, evidence });
};

const updateTraceStatus = (id: number, status: TraceStep['status']) => {
  const step = traceSteps.value.find(s => s.id === id);
  if (step) step.status = status;
};

// Formatting markdown-like bold
const formatText = (text: string) => {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
};

onMounted(() => {
  scrollToBottom();
});
</script>

<template>
  <div class="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950 font-sans text-slate-200">
    
    <div class="flex w-1/2 flex-col relative border-r border-slate-800 bg-slate-900">
      
      <div ref="chatContainer" class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        <div v-for="msg in messages" :key="msg.id" class="flex gap-4 animate-slide-in" :class="msg.role === 'user' ? 'flex-row-reverse' : ''">
          <div 
            class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-lg"
            :class="msg.role === 'agent' ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-slate-700'"
          >
            <Bot v-if="msg.role === 'agent'" class="w-4 h-4 text-white" />
            <User v-else class="w-4 h-4 text-slate-300" />
          </div>

          <div class="space-y-2 max-w-[85%]">
            <div 
              class="p-4 rounded-2xl text-sm leading-relaxed shadow-md"
              :class="[
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-300 border border-slate-700 rounded-tl-none'
              ]"
            >
              <span v-html="formatText(msg.text)"></span>
              
              <div v-if="msg.actionHtml === 'DRAFT_EMAIL'" class="mt-4 bg-slate-900 border border-slate-700 rounded-lg p-3">
                <div class="mb-2 border-b border-slate-800 pb-2 text-xs text-slate-400 font-bold">
                  Subject: Price Adjustment Request - PO #88912
                </div>
                <div class="text-xs font-mono text-slate-400 leading-relaxed">
                  <p>Dear TechSpace Team,</p>
                  <p class="mt-2">Regarding your quotation for Server Rack 42U at 35,000 THB, we noticed this exceeds our Master Agreement rate (32,000 THB) by >5%.</p>
                </div>
                <div class="mt-3 flex gap-2">
                   <button class="bg-primary hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold transition">
                     Send Email
                   </button>
                   <button class="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold transition">
                     Edit Draft
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isTyping" class="flex gap-4 animate-slide-in">
           <div class="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mt-1">
              <Bot class="w-4 h-4 text-white" />
           </div>
           <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1 items-center h-10">
              <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
              <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
              <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></span>
           </div>
        </div>

      </div>

      <div class="p-4 bg-slate-900 border-t border-slate-800 z-10">
        <div v-if="messages.length === 1" class="flex gap-2 mb-3 overflow-x-auto">
           <button @click="startDemo" class="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-red-400 px-3 py-1.5 rounded-full transition whitespace-nowrap">
             <Search class="w-3 h-3" /> เช็คราคา Server Rack กับสัญญาเก่า
           </button>
        </div>

        <div class="relative">
          <input 
            v-model="userInput"
            @keyup.enter="startDemo"
            type="text" 
            placeholder="Type your request here..." 
            class="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-slate-600 transition"
          >
          <button 
            @click="startDemo"
            class="absolute right-2 top-2 p-1.5 bg-primary hover:bg-red-700 rounded-lg text-white transition shadow-lg"
          >
            <Send class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div class="flex w-1/2 flex-col bg-slate-950 relative overflow-hidden">
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

        <div class="p-6 h-full overflow-y-auto relative z-10 custom-scrollbar">
            <div class="flex items-center justify-between mb-8">
                <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Cpu class="w-4 h-4" /> Agent Workflow Trace
                </h3>
                <div class="flex items-center gap-2">
                   <span 
                    class="text-xs font-mono transition-colors duration-300"
                    :class="agentStatus === 'PROCESSING' ? 'text-primary animate-pulse' : 'text-slate-600'"
                   >
                     {{ agentStatus }}
                   </span>
                   <div v-if="agentStatus === 'PROCESSING'" class="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                </div>
            </div>

            <div class="space-y-8 pl-2">
                <div 
                  v-for="step in traceSteps" 
                  :key="step.id" 
                  class="relative pl-6 transition-all duration-500 animate-slide-in"
                  :class="step.status === 'active' ? 'opacity-100' : 'opacity-60'"
                >
                    <div 
                      class="absolute left-0 top-0 bottom-[-32px] w-0.5"
                      :class="step.status === 'completed' ? 'bg-emerald-500/30' : 'bg-slate-800'"
                    ></div>
                    <div 
                      class="absolute -left-[5px] top-0 w-3 h-3 rounded-full border-2 transition-colors duration-500 z-10"
                      :class="[
                        step.status === 'active' ? 'bg-slate-950 border-primary shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 
                        step.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-800 border-slate-600'
                      ]"
                    ></div>

                    <div class="flex items-start justify-between mb-1">
                        <h4 
                          class="text-sm font-bold transition-colors"
                          :class="step.status === 'active' ? 'text-primary' : 'text-slate-300'"
                        >
                          {{ step.title }}
                        </h4>
                        <Loader2 v-if="step.status === 'active'" class="w-4 h-4 text-primary animate-spin" />
                        <CheckCircle2 v-else-if="step.status === 'completed'" class="w-4 h-4 text-emerald-500" />
                    </div>
                    
                    <p class="text-xs text-slate-400 font-mono mb-3 leading-relaxed">{{ step.desc }}</p>

                    <div v-if="step.evidence" class="mt-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-enter">
                        <div class="bg-slate-800/50 px-3 py-2 flex justify-between items-center border-b border-slate-800">
                            <span class="text-xs font-bold text-slate-300 flex items-center gap-2">
                              <FileText class="w-3 h-3 text-primary" /> {{ step.evidence.file }}
                            </span>
                            <span class="text-[10px] bg-emerald-900/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/30">
                              Match {{ step.evidence.match }}%
                            </span>
                        </div>
                        <div class="p-4 font-serif text-sm text-slate-400 leading-relaxed bg-slate-900/50">
                            <div v-html="step.evidence.textHtml"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>

<style scoped>
/* Keyframes & Utilities */
.animate-slide-in {
  animation: slideIn 0.4s ease-out forwards;
}

.animate-enter {
  animation: enter 0.5s ease-out forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes enter {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Scrollbar styling to match example */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; } /* Slate 900 */
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; } /* Slate 700 */
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
</style>