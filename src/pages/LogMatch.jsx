import MatchForm from '../components/MatchForm'

export default function LogMatch({ players, actions, onNavigate }) {
  return (
    <div className="max-w-2xl mx-auto">
      <MatchForm
        players={players}
        onAddMatch={async (match) => {
          await actions.addMatch(match)
          onNavigate('dashboard')
        }}
      />
    </div>
  )
}
