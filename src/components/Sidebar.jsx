import {
  Activity,
  BookOpen,
  ChartNoAxesCombined,
  ClipboardList,
  Database,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  SlidersHorizontal,
  Sparkles,
  TableProperties,
  X,
} from 'lucide-react'

const navigationGroups = [
  {
    label: 'OVERVIEW',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'LEARN',
    items: [{ id: 'theory', label: 'Theory', icon: BookOpen }],
  },
  {
    label: 'WORKSPACE',
    items: [
      { id: 'dataset', label: 'Dataset Explorer', icon: TableProperties },
      { id: 'preparation', label: 'Data Preparation', icon: SlidersHorizontal },
      { id: 'features', label: 'Feature Selection', icon: Sparkles },
    ],
  },
  {
    label: 'ANALYZE',
    items: [
      { id: 'experiment', label: 'KNN Experiment', icon: FlaskConical },
      { id: 'evaluation', label: 'Evaluation', icon: ChartNoAxesCombined },
      { id: 'prediction', label: 'Prediction & Monitoring', icon: Gauge },
    ],
  },
  {
    label: 'RECORDS',
    items: [{ id: 'history', label: 'Experiment History', icon: ClipboardList }],
  },
]

function Sidebar({ activePage, isOpen, onClose, onSelectPage }) {
  return (
    <>
      <button
        aria-label="Close navigation menu"
        className={`sidebar-backdrop${isOpen ? ' is-visible' : ''}`}
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        type="button"
      />
      <aside className={`sidebar${isOpen ? ' is-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Activity aria-hidden="true" size={21} strokeWidth={2.5} />
          </div>
          <div className="brand-copy">
            <span className="brand-name">Classify<span>Lab</span></span>
            <span className="brand-caption">VIRTUAL LAB</span>
          </div>
          <button
            aria-label="Close navigation menu"
            className="sidebar-close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>

        <div className="course-card">
          <div className="course-icon">
            <Database aria-hidden="true" size={17} />
          </div>
          <div>
            <span className="course-label">CURRENT MODULE</span>
            <span className="course-name">KNN Classification</span>
          </div>
        </div>

        <nav aria-label="Main navigation" className="sidebar-navigation">
          {navigationGroups.map((group) => (
            <div className="navigation-group" key={group.label}>
              <p className="navigation-label">{group.label}</p>
              {group.items.map(({ id, label, icon: Icon }) => (
                <button
                  aria-current={activePage === id ? 'page' : undefined}
                  className={`navigation-link${activePage === id ? ' is-active' : ''}`}
                  key={id}
                  onClick={() => onSelectPage(id)}
                  type="button"
                >
                  <Icon aria-hidden="true" size={18} strokeWidth={1.9} />
                  <span>{label}</span>
                  {id === 'dashboard' && <span className="active-indicator" />}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help-icon">
            <FlaskConical aria-hidden="true" size={17} />
          </div>
          <div>
            <strong>Learning by doing</strong>
            <span>Explore how KNN works</span>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
