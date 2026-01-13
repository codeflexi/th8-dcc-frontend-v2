// src/features/decision/store.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { decisionApi } from './api';
import type { DecisionState } from './types';

export const useDecisionStore = defineStore('decision', () => {
  const state = ref<DecisionState>({
    caseId: '',
    caseDetail: undefined, // เพิ่ม field นี้
    recommendation: 'APPROVE',
    confidenceScore: 0,
    rules: [],
    isProcessing: false,
    userDecision: undefined
  });

  async function loadContext(caseId: string) {
    state.value.isProcessing = true;
    state.value.caseId = caseId;
    try {
      // เรียก API ตัวใหม่ที่ getContext ครบทุกอย่าง
      const data = await decisionApi.getContext(caseId);
      
      state.value.caseDetail = data.caseDetail; // ✅ เก็บข้อมูล Detail
      state.value.rules = data.rules;
      state.value.confidenceScore = data.score;
      state.value.recommendation = data.recommendation as any;
      
   
      
      

    } catch (e) {
      console.error(e);
      state.value.error = 'Failed to load case context';
    } finally {
      state.value.isProcessing = false;
    }
  }

  async function submit(action: 'APPROVE' | 'REJECT', reason: string) {
    state.value.isProcessing = true;
    try {
      await decisionApi.submitDecision(state.value.caseId, action, reason);
      state.value.userDecision = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    } finally {
      state.value.isProcessing = false;
    }
  }

  async function runAnalysis() { // ✅ เพิ่ม Action นี้
    state.value.isProcessing = true;
    try {
        await decisionApi.runDecision(state.value.caseId);
        // Run เสร็จแล้ว ให้โหลดผลลัพธ์ใหม่มาโชว์ทันที
        await loadContext(state.value.caseId);
    } catch (e) {
        console.error(e);
        state.value.error = 'Analysis Failed';
    } finally {
        state.value.isProcessing = false;
    }
}

  return { state, loadContext, submit, runAnalysis };
});