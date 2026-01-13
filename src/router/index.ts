import { createRouter, createWebHashHistory } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
// ใน src/router/index.ts
 import CopilotWorkstationView from '@/features/copilot/views/CopilotWorkstationView.vue'
// import CopilotWorkstationView from '@/features/copilot/views/CopilotAgentView.vue'


const router = createRouter({
  // เปลี่ยนจาก createWebHistory(...) เป็น:
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: AppShell,
      redirect: '/cases',
      children: [
        {
          path: 'cases',
          name: 'CasePortfolio',
          component: () => import('@/features/cases/views/CasePortfolioView.vue')
        },
        // ใน children array ของ path: '/'
        // ใน children ของ path: '/'
{
  path: 'cases/new',
  name: 'CaseIngest',
  component: () => import('@/features/cases/views/CaseIngestView.vue')
},
{
  path: 'system',
  name: 'SystemControl',
  component: () => import('@/features/admin/views/SystemControlView.vue')
},
{
    path: '/copilot',
    name: 'copilot',
    component: CopilotWorkstationView,
    meta: {
      layout: 'AppLayout', // หรือชื่อ Layout หลักที่คุณใช้
      requiresAuth: false // กำหนดตามความต้องการของคุณ
    }
  },
{
  path: 'system/policy-editor',
  name: 'PolicyStudio',
  component: () => import('@/features/admin/views/PolicyStudioView.vue')
},
        {
          path: 'cases/:caseId',
          component: () => import('@/features/cases/views/CaseDetailView.vue'),
          children: [
            {
              path: '', 
              name: 'CaseDecision',
              component: () => import('@/features/decision/views/DecisionRunView.vue')
            },
            {
              path: 'evidence',
              name: 'CaseEvidence',
              component: () => import('@/features/evidence/views/EvidenceView.vue')
            },
            {
              path: 'audit',
              name: 'CaseAudit',
              component: () => import('@/features/audit/views/AuditTimelineView.vue')
            }
          ]
        }
      ]
    }
  ]
})

export default router