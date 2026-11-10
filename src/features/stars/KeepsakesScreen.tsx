import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { copy } from '../../copy/copy'
import { useServices } from '../../core/services'
import { myanmarDayNumber } from '../../core/time'
import { keepsakesFrom } from './jarState'
import type { Star } from './star'
import type { OpenedState } from './starRepository'
import { StarPhoto } from './StarUnfold'
import '../auth/auth.css'
import './stars.css'

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function Keepsake({ star }: { star: Star }) {
  const [showPhoto, setShowPhoto] = useState(false)
  return (
    <li className="keepsake">
      {star.text && <p className="unfold-text">{star.text}</p>}
      {star.hasPhoto &&
        (showPhoto ? (
          <StarPhoto starId={star.id} />
        ) : (
          <button type="button" className="auth-link-button" onClick={() => setShowPhoto(true)}>
            {copy.stars.showPhoto}
          </button>
        ))}
      {star.createdAt && <span className="star-list-meta">{dateFormat.format(star.createdAt)}</span>}
    </li>
  )
}

/** Opened stars stay here. Photos load only when tapped, to save data. */
export function KeepsakesScreen() {
  const { stars } = useServices()
  const navigate = useNavigate()
  const [received, setReceived] = useState<Star[] | null>(null)
  const [opened, setOpened] = useState<OpenedState | null>(null)

  useEffect(() => stars.watchReceived(setReceived), [stars])
  useEffect(() => stars.watchOpened(myanmarDayNumber(Date.now()), setOpened), [stars])

  const list = received && opened ? keepsakesFrom(received, opened.opened) : null

  return (
    <div className="auth-screen star-jar">
      <h1 className="auth-title">{copy.stars.keepsakesTitle}</h1>
      {list !== null && list.length === 0 && <p className="auth-intro">{copy.stars.keepsakesEmpty}</p>}
      {list && list.length > 0 && (
        <ul className="star-list keepsake-list">
          {list.map((s) => (
            <Keepsake key={s.id} star={s} />
          ))}
        </ul>
      )}
      <button type="button" className="auth-link-button" onClick={() => navigate('/place/starJar')}>
        {copy.stars.backToJar}
      </button>
    </div>
  )
}
