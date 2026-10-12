import {
  BookOpen,
  CheckSquare,
  ChartNoAxesCombined,
  ClipboardList,
  Compass,
  Database,
  FlaskConical,
  Activity,
  Route,
} from 'lucide-react'
import { History } from 'lucide-react'

export const labSections = [
  { id: 'aim', label: 'Aim', icon: Compass },
  { id: 'theory', label: 'Theory', icon: BookOpen },
  { id: 'procedure', label: 'Procedure', icon: Route },
  { id: 'preparation', label: 'Data Preparation', icon: Database },
  { id: 'simulation', label: 'Simulation', icon: FlaskConical },
  { id: 'evaluation', label: 'Evaluation', icon: ChartNoAxesCombined },
  { id: 'monitoring', label: 'Data Drift', icon: Activity },
  { id: 'exercise', label: 'Exercise', icon: CheckSquare },
  { id: 'references', label: 'References', icon: ClipboardList },
  { id: 'history', label: 'Experiment History', icon: History },
]
