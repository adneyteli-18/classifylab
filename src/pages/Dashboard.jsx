import {
  ArrowRight,
  BookOpen,
  Boxes,
  ChartNoAxesCombined,
  CircleHelp,
  Database,
  FlaskConical,
  Layers3,
  Sparkles,
} from 'lucide-react'
import EmptyState from '../components/EmptyState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useLab } from '../context/useLab.js'

function Dashboard({ onNavigate }) {
  const { dataset, runs } = useLab()

  return (
    <div className="dashboard-page">
      <PageHeader
        description="A hands-on workspace to explore how the K-Nearest Neighbors algorithm classifies data."
        eyebrow="YOUR LEARNING WORKSPACE"
        title="Welcome to ClassifyLab"
      >
        <div className="dashboard-header-actions">
          <a className="button button-secondary" href="/virtual-lab?section=theory">
            <BookOpen aria-hidden="true" size={17} />
            Explore the theory
          </a>
          <a className="button button-primary" href="/virtual-lab">
            <FlaskConical aria-hidden="true" size={17} />
            Open virtual lab
            <ArrowRight aria-hidden="true" size={16} />
          </a>
        </div>
      </PageHeader>

      <section aria-label="Workspace overview" className="stats-grid">
        <StatCard
          detail="Available in your workspace"
          icon={Layers3}
          label="Learning sections"
          tone="blue"
          value="9"
        />
        <StatCard
          detail="Stored on this device"
          icon={FlaskConical}
          label="Saved experiments"
          tone="violet"
          value={String(runs.length)}
        />
        <StatCard
          detail={dataset ? 'Ready to explore' : 'Add a dataset to get started'}
          icon={Database}
          label="Current dataset"
          tone="amber"
          value={dataset ? 'Ready' : 'Not added'}
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel getting-started-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">GETTING STARTED</p>
              <h3>Your lab, one step at a time</h3>
            </div>
            <span className="panel-heading-icon">
              <Sparkles aria-hidden="true" size={19} />
            </span>
          </div>
          <p className="panel-intro">
            Learn KNN concepts, inspect training data, and run a transparent
            classification experiment in the interactive virtual lab.
          </p>
          <div className="workflow-list">
            <a
              className="workflow-item"
              href="/virtual-lab?section=theory"
            >
              <span className="workflow-icon workflow-icon-blue">
                <BookOpen aria-hidden="true" size={18} />
              </span>
              <span className="workflow-copy">
                <strong>Learn the basics</strong>
                <span>Understand distance and nearest neighbors</span>
              </span>
              <ArrowRight aria-hidden="true" className="workflow-arrow" size={17} />
            </a>
            <a
              className="workflow-item"
              href="/virtual-lab?section=simulation"
            >
              <span className="workflow-icon workflow-icon-green">
                <Boxes aria-hidden="true" size={18} />
              </span>
              <span className="workflow-copy">
                <strong>Explore your dataset</strong>
                <span>Load or upload data for an experiment</span>
              </span>
              <ArrowRight aria-hidden="true" className="workflow-arrow" size={17} />
            </a>
            <a
              className="workflow-item"
              href="/virtual-lab?section=simulation"
            >
              <span className="workflow-icon workflow-icon-violet">
                <ChartNoAxesCombined aria-hidden="true" size={18} />
              </span>
              <span className="workflow-copy">
                <strong>Run an experiment</strong>
                <span>Classify a query point using your selected data</span>
              </span>
              <ArrowRight aria-hidden="true" className="workflow-arrow" size={17} />
            </a>
          </div>
        </article>

        <article className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">ACTIVITY</p>
              <h3>Recent experiments</h3>
            </div>
            <button
              aria-label="Open experiment history"
              className="icon-button"
              onClick={() => onNavigate('history')}
              title="Open experiment history"
              type="button"
            >
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </div>
          {runs.length > 0 ? (
            <div className="saved-run-list">
              {runs.slice(-3).reverse().map((run, index) => (
                <div className="saved-run-item" key={run.id ?? `${run.name ?? 'run'}-${index}`}>
                  <span className="saved-run-icon">
                    <FlaskConical aria-hidden="true" size={17} />
                  </span>
                  <span className="saved-run-copy">
                    <strong>{run.name ?? `Experiment ${runs.length - index}`}</strong>
                    <span>{run.datasetName ?? 'Saved experiment'}</span>
                  </span>
                  <span className="saved-run-status">Saved</span>
                </div>
              ))}
              <button
                className="text-link"
                onClick={() => onNavigate('history')}
                type="button"
              >
                View experiment history <ArrowRight aria-hidden="true" size={15} />
              </button>
            </div>
          ) : (
            <EmptyState
              compact
              description="Completed experiments saved on this device will appear here."
              icon={CircleHelp}
              title="No experiment run yet"
            />
          )}
        </article>
      </section>

      <div className="dashboard-note">
        <div className="note-icon">
          <CircleHelp aria-hidden="true" size={18} />
        </div>
        {runs.length === 0 ? (
          <p>
            <strong>No experiment has been run yet.</strong> Open the virtual
            lab to load data and calculate a real classification.
          </p>
        ) : (
          <p>
            <strong>Your saved runs are local.</strong> Predictions were
            calculated from the datasets and query points used in each saved
            experiment.
          </p>
        )}
      </div>
    </div>
  )
}

export default Dashboard
