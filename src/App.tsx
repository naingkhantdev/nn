import { copy } from './copy/copy'
import { Mochi } from './features/mochi/Mochi'

function App() {
  return (
    <main data-testid="app-root" className="app-root">
      <div style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
        <Mochi expression="happy" size={180} />
        <h1 style={{ margin: 0 }}>{copy.appName}</h1>
        <p style={{ margin: 0 }}>{copy.loading}</p>
      </div>
    </main>
  )
}

export default App
