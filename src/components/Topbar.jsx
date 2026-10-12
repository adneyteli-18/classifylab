import { BookOpen, Menu } from 'lucide-react'
import { navigationPages } from '../pages/pageConfig.js'

function Topbar({ activePage, onMenuClick }) {
  const currentPage = navigationPages.find((page) => page.id === activePage)
  const pageTitle = currentPage?.title ?? 'Dashboard'

  return (
    <header className="topbar">
      <div className="topbar-heading">
        <button
          aria-label="Open navigation menu"
          className="menu-button"
          onClick={onMenuClick}
          type="button"
        >
          <Menu aria-hidden="true" size={21} />
        </button>
        <div className="breadcrumb">
          <span className="breadcrumb-parent">ClassifyLab</span>
          <span aria-hidden="true" className="breadcrumb-divider">/</span>
          <h1>{pageTitle}</h1>
        </div>
      </div>
      <div className="topbar-meta">
        <span className="local-badge">
          <span className="status-dot" />
          Local workspace
        </span>
        <span aria-hidden="true" className="topbar-divider" />
        <span className="topbar-course">
          <BookOpen aria-hidden="true" size={16} />
          <span>Machine Learning Lab</span>
        </span>
      </div>
    </header>
  )
}

export default Topbar
