import EmptyState from '../components/EmptyState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useLab } from '../context/useLab.js'
import { navigationPages } from './pageConfig.js'

const sectionDetails = {
  theory: {
    eyebrow: 'LEARN',
    panelLabel: 'KNN CLASSIFICATION',
  },
  dataset: {
    eyebrow: 'WORKSPACE',
    panelLabel: 'DATA',
  },
  preparation: {
    eyebrow: 'WORKSPACE',
    panelLabel: 'PREPARATION',
  },
  features: {
    eyebrow: 'WORKSPACE',
    panelLabel: 'FEATURES',
  },
  experiment: {
    eyebrow: 'ANALYZE',
    panelLabel: 'EXPERIMENT',
  },
  evaluation: {
    eyebrow: 'ANALYZE',
    panelLabel: 'RESULTS',
  },
  prediction: {
    eyebrow: 'ANALYZE',
    panelLabel: 'PREDICTION',
  },
  history: {
    eyebrow: 'RECORDS',
    panelLabel: 'LOCAL HISTORY',
  },
}

function WorkspacePage({ pageId }) {
  const page = navigationPages.find((item) => item.id === pageId)
  const { runs } = useLab()

  if (!page || page.id === 'dashboard') {
    return null
  }

  const { eyebrow, panelLabel } = sectionDetails[pageId]
  const Icon = page.icon

  return (
    <div className="workspace-page">
      <PageHeader
        description={page.description}
        eyebrow={eyebrow}
        title={page.title}
      />
      <section aria-label={page.title} className="panel workspace-panel">
        <div className="workspace-panel-top">
          <span className="panel-eyebrow">{panelLabel}</span>
          <span className="coming-soon-badge">In development</span>
        </div>
        {pageId === 'history' && runs.length > 0 ? (
          <div className="saved-run-list">
            {runs.slice().reverse().map((run, index) => (
              <div
                className="saved-run-item"
                key={run.id ?? `${run.name ?? 'run'}-${index}`}
              >
                <span className="saved-run-icon">
                  <Icon aria-hidden="true" size={17} />
                </span>
                <span className="saved-run-copy">
                  <strong>{run.name ?? `Experiment ${runs.length - index}`}</strong>
                  <span>{run.datasetName ?? 'Saved experiment'}</span>
                </span>
                <span className="saved-run-status">Saved</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            description={page.emptyDescription}
            icon={Icon}
            title={page.emptyTitle}
          />
        )}
      </section>
    </div>
  )
}

export default WorkspacePage
