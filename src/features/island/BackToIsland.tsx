import { useNavigate } from 'react-router'
import { copy } from '../../copy/copy'
import '../auth/auth.css'

export function BackToIsland() {
  const navigate = useNavigate()
  return (
    <button className="auth-link-button" type="button" onClick={() => navigate('/between-islands')}>
      {copy.island.back}
    </button>
  )
}
