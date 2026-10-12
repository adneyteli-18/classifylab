import { lazy, Suspense, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Target,
} from 'lucide-react'
import ExperimentHistory from '../components/ExperimentHistory.jsx'
import DataDrift from '../components/DataDrift.jsx'
import DataPreparation from '../components/DataPreparation.jsx'
import Evaluation from '../components/Evaluation.jsx'
import LabExercise from '../components/LabExercise.jsx'
import VirtualLabNavigation from '../components/VirtualLabNavigation.jsx'
import { useLab } from '../context/useLab.js'
import { labSections } from './virtualLabSections.js'
import './virtual-lab.css'

const KnnSimulation = lazy(() => import('../components/KnnSimulation.jsx'))

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="vlab-section-heading">
      <p className="vlab-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  )
}

function AimSection({ onNavigate }) {
  return (
    <>
      <SectionHeading
        description="Explore a simple, transparent K-Nearest Neighbors classification experiment."
        eyebrow="EXPERIMENT 01 · KNN CLASSIFICATION"
        title="Aim"
      />
      <section className="vlab-card aim-card">
        <div className="aim-icon"><Target aria-hidden="true" size={23} /></div>
        <p className="aim-lead">
          To understand how a new data point can be classified by comparing its
          distance to labeled examples and using the majority label among its
          nearest neighbors.
        </p>
        <div className="aim-outcomes">
          <h2>By the end of this lab, you can</h2>
          <ul>
            <li><CheckCircle2 aria-hidden="true" size={17} /> Explain the role of <em>k</em> in a neighbor vote.</li>
            <li><CheckCircle2 aria-hidden="true" size={17} /> Compare Euclidean, Manhattan, and Chebyshev distance.</li>
            <li><CheckCircle2 aria-hidden="true" size={17} /> Trace a prediction back to its nearest training rows.</li>
            <li><CheckCircle2 aria-hidden="true" size={17} /> Observe how feature scale and data quality affect distance methods.</li>
          </ul>
        </div>
        <button className="vlab-button vlab-button-primary" onClick={() => onNavigate('theory')} type="button">
          Read the theory <ArrowRight aria-hidden="true" size={15} />
        </button>
      </section>
    </>
  )
}

function TheorySection() {
  return (
    <>
      <SectionHeading
        description="The key ideas behind a distance-based classification decision."
        eyebrow="CONCEPTS"
        title="Theory"
      />
      <div className="theory-grid">
        <article className="vlab-card theory-card theory-card-wide">
          <div className="theory-card-icon"><BookOpen aria-hidden="true" size={19} /></div>
          <h2>What is K-Nearest Neighbors?</h2>
          <p>
            KNN is a supervised learning method. It keeps labeled examples and
            classifies a new point by finding the <em>k</em> training examples
            closest to it. The most common label among those neighbors is the
            predicted class.
          </p>
          <p>
            Each row has one or more numeric features plus a class label. The
            lab lets you select features, inspect a two-feature projection,
            and trace predictions back to the nearest training rows.
          </p>
        </article>
        <article className="vlab-card theory-card">
          <div className="theory-card-icon"><Target aria-hidden="true" size={19} /></div>
          <h2>Distance metrics</h2>
          <div className="formula-block">
            <span>Euclidean</span>
            <code>d = √((x₁ − x₂)² + (y₁ − y₂)²)</code>
          </div>
          <div className="formula-block">
            <span>Manhattan</span>
            <code>d = |x₁ − x₂| + |y₁ − y₂|</code>
          </div>
          <div className="formula-block">
            <span>Chebyshev</span>
            <code>d = max(|x₁ − x₂|, |y₁ − y₂|)</code>
          </div>
        </article>
        <article className="vlab-card theory-card">
          <div className="theory-card-icon"><Lightbulb aria-hidden="true" size={19} /></div>
          <h2>Choosing k</h2>
          <p>
            A small <em>k</em> is more affected by individual examples; a
            larger <em>k</em> smooths the vote but can blur local patterns. An
            odd <em>k</em> can reduce ties in a two-class task, but does not
            guarantee that all ties are avoided.
          </p>
        </article>
        <article className="vlab-card theory-card theory-card-wide">
          <h2>Important considerations</h2>
          <ul className="theory-bullets">
            <li><strong>Scale:</strong> features measured in larger ranges can dominate distance. Normalize or standardize them when appropriate.</li>
            <li><strong>Labels:</strong> KNN requires labeled training examples for classification.</li>
            <li><strong>Data quality:</strong> noisy or unrepresentative examples can change the nearest-neighbor vote.</li>
            <li><strong>Compute cost:</strong> the basic method compares a query with the stored training examples at prediction time.</li>
          </ul>
        </article>
      </div>
    </>
  )
}

function ProcedureSection({ onNavigate }) {
  const steps = [
    ['Inspect data', 'Load the teaching set, Iris, or upload a labeled CSV; review row, feature, class, and missing-value counts.'],
    ['Prepare data', 'Select numeric features, choose a test ratio and seed, and create a reproducible stratified split.'],
    ['Fit preprocessing', 'Optionally standardize using training statistics only; enable the explicit leakage comparison to inspect the wrong approach.'],
    ['Configure KNN', 'Choose k and Euclidean, Manhattan, or Chebyshev distance.'],
    ['Run classification', 'Classify a query point and evaluate every held-out test row using the same training-only pipeline.'],
    ['Inspect and save', 'Review actual neighbors, metrics, and confusion matrix; save the run locally for history.'],
  ]
  return (
    <>
      <SectionHeading
        description="Follow these steps to run and inspect a classification."
        eyebrow="EXPERIMENT WORKFLOW"
        title="Procedure"
      />
      <section className="vlab-card procedure-card">
        <ol className="procedure-list">
          {steps.map(([title, description], index) => (
            <li key={title}>
              <span className="procedure-number">{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{title}</strong><p>{description}</p></div>
            </li>
          ))}
        </ol>
        <button className="vlab-button vlab-button-primary" onClick={() => onNavigate('simulation')} type="button">
          Open simulation <ArrowRight aria-hidden="true" size={15} />
        </button>
      </section>
    </>
  )
}

function ReferencesSection() {
  const references = [
    {
      title: 'scikit-learn: Nearest Neighbors',
      detail: 'Documentation on nearest-neighbor methods and distance metrics.',
      href: 'https://scikit-learn.org/stable/modules/neighbors.html',
    },
    {
      title: 'Cover & Hart (1967)',
      detail: 'Nearest neighbor pattern classification, IEEE Transactions on Information Theory.',
      href: 'https://doi.org/10.1109/TIT.1967.1053964',
    },
    {
      title: 'UCI Machine Learning Repository',
      detail: 'Iris dataset entry and source details.',
      href: 'https://archive.ics.uci.edu/dataset/53/iris',
    },
  ]
  return (
    <>
      <SectionHeading
        description="Further reading and resources used to prepare this learning activity."
        eyebrow="FURTHER READING"
        title="References"
      />
      <section className="vlab-card references-card">
        {references.map((reference) => (
          <a
            className="reference-item"
            href={reference.href}
            key={reference.title}
            rel="noreferrer"
            target="_blank"
          >
            <div><strong>{reference.title}</strong><span>{reference.detail}</span></div>
            <ExternalLink aria-hidden="true" size={16} />
          </a>
        ))}
        <p className="reference-note">
          These external resources open in a new tab. This project is an
          independent educational lab and is not an official IIT Virtual Labs
          product.
        </p>
      </section>
    </>
  )
}

function VirtualLab() {
  const [activeSection, setActiveSection] = useState(() => {
    const requestedSection = new URLSearchParams(window.location.search).get('section')
    return labSections.some((section) => section.id === requestedSection)
      ? requestedSection
      : 'aim'
  })
  const { dataset, split, latestEvaluation, runs, setRuns } = useLab()

  function navigateSection(section) {
    setActiveSection(section)
    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.set('section', section)
    window.history.replaceState({}, '', nextUrl)
  }

  function deleteSavedRun(id) {
    if (!id) return
    setRuns(runs.filter((run) => run.id !== id))
  }

  function renderSection() {
    switch (activeSection) {
      case 'aim':
        return <AimSection onNavigate={navigateSection} />
      case 'theory':
        return <TheorySection />
      case 'procedure':
        return <ProcedureSection onNavigate={navigateSection} />
      case 'preparation':
        return (
          <>
            <SectionHeading
              description="Inspect your data, select numeric features, and prepare a reproducible holdout split."
              eyebrow="CO1 · DATA PREPARATION"
              title="Data Preparation"
            />
            <DataPreparation onViewEvaluation={() => navigateSection('evaluation')} />
          </>
        )
      case 'simulation':
        return (
          <>
            <SectionHeading
              description="Run KNN on the selected features and inspect a test-set evaluation."
              eyebrow="CO3 · KNN CLASSIFICATION"
              title="KNN Simulation"
            />
            <Suspense fallback={<div className="vlab-loading" role="status">Loading simulation…</div>}>
              <KnnSimulation
                onPrepareData={() => navigateSection('preparation')}
                onViewEvaluation={() => navigateSection('evaluation')}
                onViewMonitoring={() => navigateSection('monitoring')}
              />
            </Suspense>
          </>
        )
      case 'evaluation':
        return (
          <>
            <SectionHeading
              description="Accuracy, macro-averaged class metrics, and confusion matrix from held-out test predictions."
              eyebrow="CO3 · TEST SET RESULTS"
              title="Evaluation"
            />
            <Evaluation
              evaluation={
                latestEvaluation ??
                [...runs].reverse().find((run) => run.evaluation)?.evaluation ??
                null
              }
            />
          </>
        )
      case 'monitoring':
        return (
          <>
            <SectionHeading
              description="Compare reference training features with incoming holdout features using a simple drift signal."
              eyebrow="CO6 · MONITORING DEMO"
              title="Data Drift"
            />
            <DataDrift onPrepareData={() => navigateSection('preparation')} />
          </>
        )
      case 'exercise':
        return (
          <>
            <SectionHeading
              description="Check your understanding of the ideas used in this experiment."
              eyebrow="PRACTICE"
              title="Exercise"
            />
            <LabExercise />
          </>
        )
      case 'references':
        return <ReferencesSection />
      case 'history':
        return (
          <>
            <SectionHeading
              description="Review, manage, and learn from your locally saved KNN runs."
              eyebrow="YOUR WORK"
              title="Experiment History"
            />
            <ExperimentHistory
              onClearHistory={() => setRuns([])}
              onDeleteRun={deleteSavedRun}
              onOpenSimulation={() => navigateSection('simulation')}
              runs={runs}
            />
          </>
        )
      default:
        return <AimSection onNavigate={navigateSection} />
    }
  }

  return (
    <div className="virtual-lab-shell">
      <VirtualLabNavigation
        activeSection={activeSection}
        onSelectSection={navigateSection}
      />
      <main className="virtual-lab-main">
        <div className="vlab-status-strip">
          <span><span className="vlab-online-dot" />Local interactive lab</span>
          <span>{dataset ? `${dataset.rows.length} dataset rows` : 'No dataset loaded'}</span>
          <span>{split ? `${split.trainingIndexes.length} train / ${split.testingIndexes.length} test` : 'No split prepared'}</span>
          <span>{runs.length} saved {runs.length === 1 ? 'experiment' : 'experiments'}</span>
        </div>
        <div className="vlab-content" key={activeSection}>
          {renderSection()}
        </div>
        <footer className="vlab-footer">
          <span>ClassifyLab · KNN Classification Virtual Lab</span>
          <span>Educational demonstration · Results are calculated locally</span>
        </footer>
      </main>
    </div>
  )
}

export default VirtualLab
