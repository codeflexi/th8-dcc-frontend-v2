<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount, computed } from 'vue'
import {
  Bot, User, Send, Cpu,
  Loader2, CheckCircle2,
  History, ChevronDown, FileText,
  Search, AlertCircle, Quote, GripVertical
} from 'lucide-vue-next'
import { copilotApi, type CopilotEvent } from '@/features/copilot/api'

// ======================================================
// 1. TYPES & INTERFACES
// ======================================================
type Role = 'agent' | 'user'

interface TraceStep {
  id: number | string
  title: string
  status: 'pending' | 'active' | 'completed'
  desc: string
}

interface EvidenceItem {
  chunk_id?: string
  content?: string
  citation?: {
    clause_id?: string
    page?: number
    [key: string]: any
  }
  similarity?: number
}

interface RunRecord {
  run_id: number
  ts: string
  question: string
  answer: string
  traceSteps: TraceStep[]
  evidences: EvidenceItem[]
  confidence: number | null
  coverage: number | null
  whyThisAnswer: any[]
}

interface Message {
  id: number
  role: Role
  text: string
  isStreaming?: boolean
}

// ======================================================
// 2. STATE MANAGEMENT
// ======================================================
// --- Chat State ---
const userInput = ref('')
const isTyping = ref(false)
const agentStatus = ref<'IDLE' | 'PROCESSING'>('IDLE')
const chatContainer = ref<HTMLElement | null>(null)
const messages = ref<Message[]>([
  { id: 1, role: 'agent', text: 'สวัสดีครับ Enterprise Copilot ยินดีให้บริการ ตรวจสอบสัญญาหรือข้อมูลส่วนใดสอบถามได้เลยครับ' }
])

// --- Copilot Intelligence State ---
const traceSteps = ref<TraceStep[]>([])
const evidences = ref<EvidenceItem[]>([])
const confidence = ref<number | null>(null)
const coverage = ref<number | null>(null)
const whyThisAnswer = ref<any[]>([])

// --- Evidence Viewer State ---
const highlightedText = ref('')
const showHighlight = ref(false)
const matchScore = ref(0)
const currentEvidenceId = ref<string | undefined>(undefined)

// --- History & Sidebar State ---
const runs = ref<RunRecord[]>([])
const showHistoryMenu = ref(false)
const sidebarWidth = ref(400) 
const isResizing = ref(false)

// ======================================================
// 3. LOGIC & COMPOSABLES
// ======================================================

// --- Helper: Colors & Formatting ---
const getConfidenceColor = (val: number | null) => {
  if (val === null) return 'bg-slate-100 text-slate-500'
  if (val < 0.35) return 'bg-rose-100 text-rose-700 border-rose-200'
  if (val < 0.7) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-emerald-100 text-emerald-700 border-emerald-200'
}

const formatEvidenceLabel = (e: EvidenceItem, idx: number) => {
  const c = e.citation || {}
  const parts = []
  if (c.clause_id) parts.push(`Clause ${c.clause_id}`)
  if (c.page) parts.push(`Page ${c.page}`)
  return parts.length ? parts.join(', ') : `Source #${idx + 1}`
}

// --- Logic: Splitter Resizing ---
const startResize = (e: MouseEvent) => {
  e.preventDefault() 
  isResizing.value = true
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none' 
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return
  // Constraints: Min 300px, Max 800px
  const newWidth = Math.max(300, Math.min(800, e.clientX))
  sidebarWidth.value = newWidth
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// --- Logic: Streaming Buffer ---
const tokenBuffer = ref('')
const currentAiMsgId = ref<number>(-1)
let flushTimer: number | null = null

const startFlush = () => {
  stopFlush()
  flushTimer = window.setInterval(() => {
    if (!tokenBuffer.value) return
    const aiMsg = messages.value.find(m => m.id === currentAiMsgId.value)
    if (aiMsg) {
      aiMsg.text += tokenBuffer.value
      tokenBuffer.value = ''
      scrollToBottom()
    }
  }, 50)
}

const stopFlush = () => {
  if (flushTimer) {
    clearInterval(flushTimer)
    flushTimer = null
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

onBeforeUnmount(stopFlush)

// --- Logic: Evidence Interaction ---
const pickEvidence = (e: EvidenceItem) => {
  highlightedText.value = e.content || ''
  matchScore.value = Math.round((e.similarity || 0) * 100)
  showHighlight.value = true
  currentEvidenceId.value = e.chunk_id
}

const loadRun = (runId: number) => {
  const r = runs.value.find(x => x.run_id === runId)
  if (!r) return
  traceSteps.value = r.traceSteps
  evidences.value = r.evidences
  confidence.value = r.confidence
  coverage.value = r.coverage
  whyThisAnswer.value = r.whyThisAnswer
  
  if (r.evidences.length > 0) pickEvidence(r.evidences[0])
}

const citationSuperscripts = computed(() =>
  (whyThisAnswer.value || []).slice(0, 6).map((w, i) => ({
    n: i + 1,
    chunk_id: w.chunk_id,
    similarity: w.similarity || 0
  }))
)

const openCitation = (n: number) => {
  const w = citationSuperscripts.value.find(x => x.n === n)
  if (w) {
    const match = evidences.value.find(e => e.chunk_id === w.chunk_id)
    if (match) pickEvidence(match)
  }
}

// ======================================================
// 4. MAIN ACTION: SEND MESSAGE
// ======================================================
const sendMessage = async () => {
  if (!userInput.value.trim()) return

  const question = userInput.value.trim()
  userInput.value = ''

  messages.value.push({ id: Date.now(), role: 'user', text: question })

  const aiMsgId = Date.now() + 1
  currentAiMsgId.value = aiMsgId
  messages.value.push({ id: aiMsgId, role: 'agent', text: '', isStreaming: true })

  isTyping.value = true
  agentStatus.value = 'PROCESSING'
  traceSteps.value = []
  evidences.value = []
  confidence.value = null
  coverage.value = null
  whyThisAnswer.value = []
  highlightedText.value = ''
  showHighlight.value = false
  currentEvidenceId.value = undefined
  tokenBuffer.value = ''

  scrollToBottom()
  startFlush()

  try {
    await copilotApi.streamChat({ query: question }, (event: CopilotEvent) => {
      switch (event.type) {
        case 'trace':
          traceSteps.value.push({
            id: event.data.step_id,
            title: event.data.title,
            status: event.data.status,
            desc: event.data.desc
          })
          break
          
        case 'evidence_reveal':
          const ev: EvidenceItem = {
            chunk_id: event.data.chunk_id,
            content: event.data.content,
            citation: event.data.citation,
            similarity: event.data.similarity
          }
          evidences.value.push(ev)
          if (evidences.value.length === 1) pickEvidence(ev)
          break

        case 'message_chunk':
          tokenBuffer.value += String(event.data.text || '')
          break

        case 'final':
          const aiMsg = messages.value.find(m => m.id === aiMsgId)
          if (aiMsg) {
             if (tokenBuffer.value) aiMsg.text += tokenBuffer.value
             tokenBuffer.value = ''
             aiMsg.isStreaming = false
          }
          
          confidence.value = event.data.confidence ?? null
          coverage.value = event.data.coverage ?? null
          whyThisAnswer.value = event.data.why_this_answer || []

          runs.value.unshift({
            run_id: Date.now(),
            ts: new Date().toLocaleTimeString(),
            question,
            answer: aiMsg?.text || '',
            traceSteps: [...traceSteps.value],
            evidences: [...evidences.value],
            confidence: confidence.value,
            coverage: coverage.value,
            whyThisAnswer: [...whyThisAnswer.value]
          })

          isTyping.value = false
          agentStatus.value = 'IDLE'
          stopFlush()
          scrollToBottom()
          break
          
        case 'error':
          console.error(event.data)
          isTyping.value = false
          agentStatus.value = 'IDLE'
          stopFlush()
          break
      }
    })
  } catch (e) {
    console.error(e)
    isTyping.value = false
    stopFlush()
  }
}

const suggestedQuestions = [
  { label: '💸 ราคาสินค้า', query: 'ราคาสินค้าตามสัญญาคือเท่าไหร่' },
  { label: '📅 เงื่อนไขชำระ', query: 'เงื่อนไขการชำระเงินเป็นอย่างไร' },
  { label: '🚚 SLA ส่งมอบ', query: 'กำหนด SLA การส่งมอบไว้กี่วัน' },
  { label: '⚠️ ค่าปรับ', query: 'หากส่งล่าช้ามีค่าปรับอย่างไร' },
]

const askSuggested = (q: string) => {
  if (agentStatus.value === 'PROCESSING') return
  userInput.value = q
  sendMessage()
}
</script>

<template>
  <div class="flex h-full w-full bg-slate-50 text-slate-800 font-sans overflow-hidden border border-slate-200 rounded-lg">

    <aside 
      class="flex-none bg-white flex flex-col relative z-10 border-r border-slate-200"
      :style="{ width: sidebarWidth + 'px' }"
    >
      <div class="flex-none h-14 px-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-sm z-20">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200">
            <Bot class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-sm font-bold text-slate-800 leading-tight">Copilot</h1>
          </div>
        </div>

        <div class="relative">
          <button 
            @click="showHistoryMenu = !showHistoryMenu"
            class="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            title="History"
          >
            <History class="w-4 h-4" />
          </button>
          <div v-if="showHistoryMenu" class="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5">
            <div class="bg-slate-50 px-4 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Recent Audits
            </div>
            <div class="max-h-64 overflow-y-auto">
              <div v-if="!runs.length" class="p-6 text-center text-xs text-slate-400">No history available</div>
              <button
                v-for="r in runs"
                :key="r.run_id"
                @click="loadRun(r.run_id); showHistoryMenu = false"
                class="w-full text-left px-4 py-3 hover:bg-red-50 border-b border-slate-50 last:border-0 group transition-colors"
              >
                <p class="text-xs font-semibold text-slate-700 truncate group-hover:text-red-700">{{ r.question }}</p>
                <div class="flex justify-between items-center mt-1">
                  <span class="text-[10px] text-slate-400">{{ r.ts }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref="chatContainer" class="flex-1 overflow-y-auto min-h-0 p-4 space-y-6 scroll-smooth">
        <div class="text-center py-6">
           <div class="inline-flex items-center justify-center p-3 bg-red-50 rounded-full mb-3">
             <Bot class="w-6 h-6 text-red-600" />
           </div>
           <p class="text-sm text-slate-500">Ask me anything about your contracts.</p>
        </div>

        <div v-for="m in messages" :key="m.id" class="flex flex-col gap-1 transition-all duration-300 ease-out">
          <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1" :class="m.role === 'user' ? 'flex-row-reverse' : ''">
            <span>{{ m.role === 'agent' ? 'Copilot' : 'You' }}</span>
          </div>

          <div class="flex gap-3" :class="m.role === 'user' ? 'flex-row-reverse' : ''">
            <div class="flex-none w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
              :class="m.role === 'agent' ? 'bg-white border border-slate-200' : 'bg-red-600 text-white'">
              <Bot v-if="m.role === 'agent'" class="w-4 h-4 text-red-600" />
              <User v-else class="w-4 h-4" />
            </div>

            <div 
              class="max-w-[85%] px-4 py-3 text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap relative group"
              :class="[
                m.role === 'user' 
                  ? 'bg-red-600 text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm'
              ]"
            >
              {{ m.text }}
              <span v-if="m.isStreaming" class="inline-block w-1.5 h-4 align-middle bg-red-400 animate-pulse ml-1"></span>

              <div 
                v-if="m.role === 'agent' && m.id === currentAiMsgId && citationSuperscripts.length > 0" 
                class="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5"
              >
                <span class="text-[10px] text-slate-400 mr-1 self-center">Sources:</span>
                <button
                  v-for="c in citationSuperscripts"
                  :key="c.n"
                  @click="openCitation(c.n)"
                  class="flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all text-[10px] font-medium text-slate-600"
                >
                  <sup class="font-bold text-red-500">{{ c.n }}</sup>
                  <span>{{ (c.similarity * 100).toFixed(0) }}%</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isTyping" class="flex gap-3">
           <div class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
             <Loader2 class="w-4 h-4 animate-spin text-red-500" />
           </div>
           <span class="text-xs text-slate-400 self-center">Analyzing documents...</span>
        </div>
      </div>

      <div class="flex-none p-4 bg-white border-t border-slate-100 z-20">
        <div class="flex overflow-x-auto gap-2 pb-3 no-scrollbar mb-1">
          <button
            v-for="(s, idx) in suggestedQuestions"
            :key="idx"
            @click="askSuggested(s.query)"
            class="flex-none px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors whitespace-nowrap"
          >
            {{ s.label }}
          </button>
        </div>

        <div class="relative">
          <input
            v-model="userInput"
            @keyup.enter="sendMessage"
            placeholder="Type your question..."
            class="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all shadow-sm"
          />
          <button 
            @click="sendMessage"
            :disabled="!userInput.trim() || isTyping"
            class="absolute right-2 top-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors shadow-md shadow-red-200"
          >
            <Send class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <div
      class="w-1 hover:w-1.5 bg-slate-200 hover:bg-red-400 cursor-col-resize flex flex-col justify-center items-center transition-all z-20 group relative -ml-[1px]"
      :class="{ 'bg-red-500 w-1.5': isResizing }"
      @mousedown="startResize"
    >
      <div class="h-12 w-1 bg-white/50 rounded-full group-hover:bg-white shadow-sm"></div>
    </div>

    <main class="flex-1 bg-slate-100/50 flex flex-col min-w-0 overflow-hidden">
      <header class="flex-none h-14 px-6 border-b border-slate-200 bg-white flex justify-between items-center">
        <div class="flex items-center gap-2">
          <FileText class="w-5 h-5 text-slate-400" />
          <h2 class="text-sm font-bold text-slate-700">Document Evidence</h2>
        </div>
        
        <div v-if="confidence !== null" class="flex gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold" :class="getConfidenceColor(confidence)">
            <CheckCircle2 class="w-3.5 h-3.5" />
            <span>Confidence {{ (confidence * 100).toFixed(0) }}%</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white border-slate-200 text-slate-600 text-xs font-medium">
             <Search class="w-3.5 h-3.5 text-slate-400" />
             <span>Coverage {{ (coverage ? (coverage * 100).toFixed(0) : 0) }}%</span>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto min-h-0 p-6 scroll-smooth">
        <div v-if="!showHighlight && !evidences.length" class="h-full flex flex-col items-center justify-center text-slate-400">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
             <Search class="w-8 h-8 text-slate-300" />
          </div>
          <p class="text-sm font-medium">No evidence selected</p>
          <p class="text-xs mt-1">Ask a question to retrieve document snippets.</p>
        </div>

        <div v-else class="max-w-3xl mx-auto space-y-6">
          <div v-if="showHighlight" class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ring-4 ring-red-50/50 transition-all">
             <div class="bg-amber-50/50 border-b border-amber-100 px-5 py-3 flex justify-between items-center">
                <div class="flex items-center gap-2 text-amber-700">
                   <Quote class="w-4 h-4 fill-amber-200 text-amber-500" />
                   <span class="text-xs font-bold uppercase tracking-wide">Selected Excerpt</span>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-white rounded border border-amber-200 text-amber-600 shadow-sm">
                   Match {{ matchScore }}%
                </span>
             </div>
             <div class="p-6 text-sm leading-7 text-slate-700 font-serif bg-[#fffbf5]">
                {{ highlightedText }}
             </div>
          </div>

          <div v-if="evidences.length">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">All Retrieved Segments</h3>
            <div class="grid gap-3">
              <button 
                v-for="(e, idx) in evidences"
                :key="e.chunk_id || idx"
                @click="pickEvidence(e)"
                class="text-left bg-white p-4 rounded-lg border hover:shadow-md transition-all group relative"
                :class="currentEvidenceId === e.chunk_id ? 'border-red-500 ring-1 ring-red-500 shadow-md' : 'border-slate-200 hover:border-red-300'"
              >
                <div class="flex justify-between items-start mb-2">
                   <div class="flex items-center gap-2">
                      <span class="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold flex items-center justify-center text-slate-500 group-hover:bg-red-100 group-hover:text-red-600">
                         {{ idx + 1 }}
                      </span>
                      <span class="text-xs font-semibold text-slate-700 group-hover:text-red-700">
                         {{ formatEvidenceLabel(e, idx) }}
                      </span>
                   </div>
                   <span class="text-[10px] text-slate-400">
                      Sim: {{ e.similarity?.toFixed(2) }}
                   </span>
                </div>
                <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                   {{ e.content }}
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <aside class="flex-none w-[280px] bg-white border-l border-slate-200 flex flex-col z-10">
      <div class="flex-none h-14 px-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
        <Cpu class="w-4 h-4 text-red-500" />
        <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wide">Workflow Trace</h3>
      </div>

      <div class="flex-1 overflow-y-auto min-h-0 p-5">
        <div v-if="!traceSteps.length" class="text-center mt-10 opacity-40">
           <Cpu class="w-12 h-12 mx-auto mb-2 text-slate-300" />
           <p class="text-xs text-slate-400">System Idle</p>
        </div>

        <div class="relative pl-2 space-y-6">
          <div class="absolute left-[15px] top-2 bottom-2 w-[1px] bg-slate-200" v-if="traceSteps.length > 1"></div>
          <div v-for="(s, index) in traceSteps" :key="s.id" class="relative pl-6">
            <div class="absolute left-[9px] top-1 w-3 h-3 rounded-full border-2 bg-white z-10 flex items-center justify-center"
              :class="{
                'border-emerald-500': s.status === 'completed',
                'border-red-500 animate-pulse': s.status === 'active',
                'border-slate-300': s.status === 'pending'
              }"
            >
               <div v-if="s.status === 'completed'" class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            </div>
            <div class="space-y-1">
              <h4 class="text-xs font-bold text-slate-700" :class="{'text-red-600': s.status === 'active'}">
                {{ s.title }}
              </h4>
              <p class="text-[10px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                {{ s.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>

  </div>
</template>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>