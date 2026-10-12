import { lazy, Suspense } from 'react'
import LabProvider from './context/LabContext.jsx'
import './styles/base.css'

const VirtualLab = lazy(() => import('./pages/VirtualLab.jsx'))

function App() {
  return (
    <LabProvider>
      <Suspense fallback={<div className="virtual-lab-loading">Loading virtual lab…</div>}>
        <VirtualLab />
      </Suspense>
    </LabProvider>
  )
}

export default App
