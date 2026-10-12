import { useEffect, useState } from 'react'
import { Lightbulb, Menu, X } from 'lucide-react'
import { labSections } from '../pages/virtualLabSections.js'

const navigationSections = labSections.filter(
  ({ id }) => id !== 'evaluation' && id !== 'monitoring',
)

function VirtualLabNavigation({ activeSection, onSelectSection }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    if (!isDrawerOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsDrawerOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDrawerOpen])

  function selectSection(section) {
    onSelectSection(section)
    setIsDrawerOpen(false)
  }

  return (
    <>
      <aside
        aria-label="Main navigation"
        className={`vlab-sidebar${isDrawerOpen ? ' is-open' : ''}`}
        id="classifylab-navigation"
      >
        <a className="vlab-brand" href={window.location.pathname}>
          <span className="vlab-brand-mark">
            <Lightbulb aria-hidden="true" size={20} />
          </span>
          <span>
            <strong>ClassifyLab</strong>
            <small>VIRTUAL LAB</small>
          </span>
        </a>
        <div className="vlab-sidebar-title">KNN CLASSIFICATION</div>
        <nav aria-label="Virtual lab sections" className="vlab-nav">
          {navigationSections.map(({ id, label, icon: Icon }, index) => (
            <button
              aria-current={activeSection === id ? 'page' : undefined}
              className={`vlab-nav-link${activeSection === id ? ' is-active' : ''}`}
              key={id}
              onClick={() => selectSection(id)}
              type="button"
            >
              <span className="vlab-nav-icon">
                <Icon aria-hidden="true" size={17} />
              </span>
              <span>{label}</span>
              <span className="vlab-nav-number">{String(index + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </nav>
        <div className="vlab-sidebar-bottom">
          <span className="vlab-online-dot" />
          <span>Runs locally in your browser</span>
        </div>
      </aside>
      {isDrawerOpen && (
        <button
          aria-label="Close navigation menu"
          className="vlab-drawer-backdrop"
          onClick={() => setIsDrawerOpen(false)}
          type="button"
        />
      )}
      <header className="vlab-topbar">
        <button
          aria-controls="classifylab-navigation"
          aria-expanded={isDrawerOpen}
          aria-label={isDrawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="vlab-menu-button"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          type="button"
        >
          {isDrawerOpen ? <X aria-hidden="true" size={19} /> : <Menu aria-hidden="true" size={19} />}
        </button>
        <div className="vlab-breadcrumb">
          <span>ClassifyLab</span>
          <span aria-hidden="true">/</span>
          <strong>{labSections.find((section) => section.id === activeSection)?.label}</strong>
        </div>
        <span className="vlab-topbar-caption">KNN CLASSIFICATION · VIRTUAL LAB</span>
      </header>
    </>
  )
}

export default VirtualLabNavigation
