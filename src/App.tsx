import { lazy, Suspense } from 'react'
import { Skeleton } from 'antd'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'

const Home = lazy(() => import('@/pages/Home'))
const Report = lazy(() => import('@/pages/Report'))
const Reviewing = lazy(() => import('@/pages/Reviewing'))
const Submit = lazy(() => import('@/pages/Submit'))

function RouteFallback() {
  return (
    <div className="route-fallback" aria-label="页面加载中" aria-live="polite">
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="submit" element={<Submit />} />
            <Route path="reviewing" element={<Reviewing />} />
            <Route path="report" element={<Report />} />
            <Route path="report/:taskId" element={<Report />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
