import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMe, login as loginRequest, logout as logoutRequest, register as registerRequest, type AuthUser, type LoginPayload, type RegisterPayload } from '@/api/auth'
import { usePresentation } from '@/context/PresentationContext'

interface AuthContextValue {
  user: AuthUser | null
  token: string
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (payload: LoginPayload) => Promise<AuthUser>
  register: (payload: RegisterPayload) => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const TOKEN_KEY = 'outbound_guard_token'
const demoUser: AuthUser = { userId: 'competition-demo', username: '比赛评审账号', role: 'admin', company: '东盟品牌合规演示企业', createdAt: '2026-07-20 09:00' }

export function AuthProvider({ children }: { children: ReactNode }) {
  const { mode, exitPresentation } = usePresentation()
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY) ?? '')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(Boolean(token))
  const isDemo = mode === 'demo'

  useEffect(() => {
    if (isDemo || !token) { setLoading(false); return }
    let mounted = true
    getMe().then((nextUser) => mounted && setUser(nextUser)).catch(() => { window.localStorage.removeItem(TOKEN_KEY); if (mounted) { setToken(''); setUser(null) } }).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [isDemo, token])

  const persistSession = useCallback((nextToken: string, nextUser: AuthUser) => { window.localStorage.setItem(TOKEN_KEY, nextToken); setToken(nextToken); setUser(nextUser) }, [])
  const login = useCallback(async (payload: LoginPayload) => { exitPresentation(); const result = await loginRequest(payload); persistSession(result.token, result.user); return result.user }, [exitPresentation, persistSession])
  const register = useCallback(async (payload: RegisterPayload) => { exitPresentation(); const result = await registerRequest(payload); persistSession(result.token, result.user); return result.user }, [exitPresentation, persistSession])
  const logout = useCallback(async () => {
    if (isDemo) { exitPresentation(); return }
    if (token) await logoutRequest().catch(() => undefined)
    window.localStorage.removeItem(TOKEN_KEY); setToken(''); setUser(null)
  }, [exitPresentation, isDemo, token])

  const activeUser = isDemo ? demoUser : user
  return <AuthContext.Provider value={useMemo(() => ({ user: activeUser, token: isDemo ? 'competition-demo-session' : token, loading, isAuthenticated: isDemo || Boolean(user && token), isAdmin: isDemo || user?.role === 'admin', login, register, logout }), [activeUser, isDemo, loading, login, logout, register, token, user])}>{children}</AuthContext.Provider>
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context }
