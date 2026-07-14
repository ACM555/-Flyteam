import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import Home from '@/pages/Home'
import Report from '@/pages/Report'
import Reviewing from '@/pages/Reviewing'
import Submit from '@/pages/Submit'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="submit" element={<Submit />} />
          <Route path="reviewing" element={<Reviewing />} />
          <Route path="report" element={<Report />} />
          <Route path="report/:taskId" element={<Report />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
