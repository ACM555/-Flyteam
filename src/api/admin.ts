import request from './request'
import type { UnifiedResponse } from '@/types/audit'

export interface AdminStatistics {
  auditedBrands: number
  highRiskBlocked: number
  totalTasks: number
  processingTasks: number
  registeredUsers: number
  mediumRisk: number
}

export interface AdminTask {
  taskId: string
  status: 'pending' | 'processing' | 'done' | 'error'
  currentStep: number
  progress: number
  brandName: string
  niceClass: string
  targetCountries: string[]
  riskLevel: 'high' | 'medium' | 'low' | ''
  riskScore: number
  manualReviewRequired: boolean
  createdAt: string
  updatedAt: string
  errorMessage: string
}

export interface AdminTaskDetail {
  task_id: string
  status: string
  current_step: number
  progress: number
  error_message: string
  created_at: string
  updated_at: string
  request: Record<string, unknown>
  result: Record<string, unknown> | null
}

export async function getAdminStatistics(): Promise<AdminStatistics> {
  const res = (await request.get('/admin/statistics')) as UnifiedResponse<AdminStatistics>
  return res.data
}

export async function getAdminTasks(): Promise<AdminTask[]> {
  const res = (await request.get('/admin/tasks')) as UnifiedResponse<AdminTask[]>
  return res.data
}

export async function getAdminTaskDetail(taskId: string): Promise<AdminTaskDetail> {
  const res = (await request.get(`/admin/tasks/${taskId}`)) as UnifiedResponse<AdminTaskDetail>
  return res.data
}
