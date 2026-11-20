import { copy } from '../copy/copy'

export function QuickNotes({ choose }: { choose: (note: string) => void }) {
  return <div className="quick-notes">
    {copy.quickNotes.map(note => (
      <button key={note} type="button" onClick={() => choose(note)}>{note}</button>
    ))}
  </div>
}
