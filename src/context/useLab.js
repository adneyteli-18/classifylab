import { useContext } from 'react'
import LabContext from './labContextValue.js'

export function useLab() {
  const context = useContext(LabContext)
  if (!context) {
    throw new Error('useLab must be used inside a LabProvider.')
  }
  return context
}
