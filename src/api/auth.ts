import request from './request'
import type { UnifiedResponse } from '@/types/audit'

export interface AuthUser {
  userId: string
  username: string
  role: 'superadmin' | 'user'
  company: string
  createdAt: string
}

export interface AuthResult {
  token: string
  user: AuthUser
}

export interface RegisterPayload {
  username: string
  password: string
  company?: string
  inviteCode?: string
}

export interface LoginPayload {
  username: string
  password: string
}

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const res = (await request.post('/auth/login', payload)) as UnifiedResponse<AuthResult>
  return res.data
}

export async function demoLogin(): Promise<AuthResult> {
  const res = (await request.post('/auth/demo')) as UnifiedResponse<AuthResult>
  return res.data
}

export async function getDemoStatus(): Promise<boolean> {
  const res = (await request.get('/auth/demo/status')) as UnifiedResponse<{ enabled: boolean }>
  return Boolean(res.data?.enabled)
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const res = (await request.post('/auth/register', payload)) as UnifiedResponse<AuthResult>
  return res.data
}

export async function getMe(): Promise<AuthUser> {
  const res = (await request.get('/auth/me')) as UnifiedResponse<AuthUser>
  return res.data
}

export async function logout(): Promise<void> {
  await request.post('/auth/logout')
}
