import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'

const Admin = lazy(() => import('@/pages/Admin'))
const Auth = lazy(() => import('@/pages/Auth'))
const BrandAssets = lazy(() => import('@/pages/BrandAssets'))
const Home = lazy(() => import('@/pages/Home'))
const Monitoring = lazy(() => import('@/pages/Monitoring'))
const Report = lazy(() => import('@/pages/Report'))
const Reports = lazy(() => import('@/pages/Reports'))
const Reviewing = lazy(() => import('@/pages/Reviewing'))
const RulesLibrary = lazy(() => import('@/pages/RulesLibrary'))
const Submit = lazy(() => import('@/pages/Submit'))

function LoadingScreen() {
  return <div className="route-loading"><div className="route-loading-card"><span className="loading-mark" />正在载入工作空间</div></div>
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/" element={<AppLayout />}>
            <Route element={<ProtectedRoute />}>
              <Route index element={<Home />} />
              <Route path="assets" element={<BrandAssets />} />
              <Route path="submit" element={<Submit />} />
              <Route path="reviewing" element={<Reviewing />} />
              <Route path="reports" element={<Reports />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="rules" element={<RulesLibrary />} />
              <Route path="report" element={<Report />} />
              <Route path="report/:taskId" element={<Report />} />
            </Route>
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="admin" element={<Admin />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
