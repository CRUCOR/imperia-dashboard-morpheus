import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Jobs } from '@/pages/Jobs'
import { Files } from '@/pages/Files'
import { Results } from '@/pages/Results'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/files" element={<Files />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Layout>
  )
}

export default App