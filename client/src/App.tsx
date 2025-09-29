import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Jobs } from '@/pages/Jobs'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
      </Routes>
    </Layout>
  )
}

export default App