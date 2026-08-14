import MatchForm from '../components/MatchForm'

export default function LogMatch({ players, actions, onNavigate, isSuperAdmin }) {
  return (
    <div className="max-w-2xl mx-auto">
      <MatchForm
        players={players}
        isSuperAdmin={isSuperAdmin}
        onAddMatch={async (match) => {
          await actions.addMatch(match)
          onNavigate('dashboard')
        }}
      />
    </div>
  )
}
