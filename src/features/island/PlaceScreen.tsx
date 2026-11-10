import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router'
import { copy } from '../../copy/copy'
import type { Features } from '../../core/members'
import { Mochi } from '../mochi/Mochi'
import { FeelingsScreen } from '../feelings/FeelingsScreen'
import { MochiHouseScreen } from '../mochi/MochiHouseScreen'
import { StarJarScreen } from '../stars/StarJarScreen'
import { BackToIsland } from './BackToIsland'
import { isOpen, isPlaceId, type IslandPlaceId } from './places'
import '../auth/auth.css'

/**
 * Screens for open places. Tasks 11, 12, and 16 register theirs here;
 * an open place without one shows a friendly placeholder.
 */
export const placeScreens: Partial<Record<IslandPlaceId, () => ReactNode>> = {
  mochiHouse: () => <MochiHouseScreen />,
  starJar: () => <StarJarScreen />,
  feelings: () => <FeelingsScreen />,
}

function PlacePlaceholder({ place }: { place: IslandPlaceId }) {
  return (
    <div className="auth-screen">
      <Mochi expression="happy" size={120} />
      <h1 className="auth-title">{copy.places[place]}</h1>
      <p className="auth-intro">{copy.island.roomComingSoon}</p>
      <BackToIsland />
    </div>
  )
}

/** /place/:id — closed or unknown places go back to the island. */
export function PlaceScreen({ features }: { features: Features }) {
  const { id } = useParams()
  if (!isPlaceId(id) || !isOpen(id, features)) return <Navigate to="/" replace />
  const screen = placeScreens[id]
  return <>{screen ? screen() : <PlacePlaceholder place={id} />}</>
}

/** Settings placeholder until Task 14. Sign-out lives here for now. */
export function SettingsScreen({ signOut }: { signOut: () => Promise<void> }) {
  return (
    <div className="auth-screen">
      <Mochi expression="idle" size={110} />
      <h1 className="auth-title">{copy.island.settings}</h1>
      <button className="auth-button" type="button" onClick={() => void signOut()}>
        {copy.auth.signOut}
      </button>
      <BackToIsland />
    </div>
  )
}
