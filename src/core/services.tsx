import { createContext, useContext, type ReactNode } from 'react'
import type { FeelingRepository } from '../features/feelings/feelingRepository'
import type { StarRepository } from '../features/stars/starRepository'

/** Data services for signed-in screens. Real ones in main.tsx; fakes in tests and e2e. */
export interface Services {
  stars: StarRepository
  feelings: FeelingRepository
}

const ServicesContext = createContext<Services | null>(null)

export function ServicesProvider({ services, children }: { services: Services; children: ReactNode }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

export function useServices(): Services {
  const services = useContext(ServicesContext)
  if (!services) throw new Error('useServices needs a ServicesProvider')
  return services
}
