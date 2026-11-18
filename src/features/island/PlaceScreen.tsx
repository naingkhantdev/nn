import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router'
import { copy } from '../../copy/copy'
import type { Features } from '../../core/members'
import { Mochi } from '../mochi/Mochi'
import { FeelingsScreen } from '../feelings/FeelingsScreen'
import { MochiHouseScreen } from '../mochi/MochiHouseScreen'
import { StarJarScreen } from '../stars/StarJarScreen'
import { BackToIsland } from './BackToIsland'
import { GardenScreen, LanternScreen, MessageBottleScreen, SnailPostScreen, SulkCloudScreen } from './PlaceFeatures'
import { isOpen, isPlaceId, type IslandPlaceId } from './places'
import { AuthFailure, type AuthRepository } from '../auth/authRepository'
import { useServices } from '../../core/services'
import { clearCare } from '../mochi/mochiMood'
import { useState, type FormEvent } from 'react'
import '../auth/auth.css'

/**
 * Screens for open places. Tasks 11, 12, and 16 register theirs here;
 * an open place without one shows a friendly placeholder.
 */
export const placeScreens: Partial<Record<IslandPlaceId, () => ReactNode>> = {
  mochiHouse: () => <MochiHouseScreen />,
  starJar: () => <StarJarScreen />,
  feelings: () => <FeelingsScreen />,
  sulkCloud: () => <SulkCloudScreen />,
  snailPost: () => <SnailPostScreen />,
  lantern: () => <LanternScreen />,
  garden: () => <GardenScreen />,
  bottle: () => <MessageBottleScreen />,
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

/** Settings includes account controls and the in-app data removal path. */
export function SettingsScreen({ signOut, deleteAccount }: { signOut: () => Promise<void>; deleteAccount?: AuthRepository['deleteAccount'] }) {
  const { island, push } = useServices()
  const [confirming, setConfirming] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  async function removeAccount(e: FormEvent) {
    e.preventDefault()
    if (!deleteAccount || busy) return
    setBusy(true); setMessage(null)
    try {
      await deleteAccount(phrase, async () => { await push.disable(); await island.deleteMyData(); clearCare() })
    } catch (err) {
      setMessage(err instanceof AuthFailure ? copy.auth[err.kind] : copy.placesUi.deleteFailed)
      setBusy(false)
    }
  }
  return (
    <div className="auth-screen island-settings-page">
      <Mochi expression="idle" size={110} />
      <h1 className="auth-title">{copy.island.settings}</h1>
      <p className="auth-intro">{copy.placesUi.aboutPrivacy}</p>
      <button className="auth-button" type="button" onClick={() => void signOut()}>{copy.auth.signOut}</button>
      {!confirming ? (
        <button className="auth-link-button" type="button" onClick={() => setConfirming(true)}>{copy.placesUi.deleteTitle}</button>
      ) : (
        <form className="auth-card" onSubmit={(e) => void removeAccount(e)}>
          <p className="auth-intro">{copy.placesUi.deleteIntro}</p>
          <label className="auth-field">{copy.placesUi.deletePhrase}<input type="password" autoComplete="current-password" value={phrase} onChange={(e) => setPhrase(e.target.value)} required /></label>
          {message && <p className="auth-message" role="alert">{message}</p>}
          <button className="auth-button island-delete-button" type="submit" disabled={busy || !phrase}>{busy ? copy.placesUi.deleting : copy.placesUi.deleteConfirm}</button>
          <button className="auth-link-button" type="button" disabled={busy} onClick={() => { setConfirming(false); setPhrase(''); setMessage(null) }}>{copy.island.back}</button>
        </form>
      )}
      <BackToIsland />
    </div>
  )
}