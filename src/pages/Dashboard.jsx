import { useState } from 'react'
import FilterBar from '../components/FilterBar'
import StatCards from '../components/StatCards'
import TopSeeds from '../components/TopSeeds'
import Leaderboard from '../components/Leaderboard'
import MatchList from '../components/MatchList'
import VideoSection from '../components/VideoSection'
import PhotoGallery from '../components/PhotoGallery'
import { computeStats, filterByPeriod } from '../lib/ranking'
import { exportAll } from '../lib/api'

export default function Dashboard({ data, actions, onNavigate, onImport }) {
  const [period, setPeriod] = useState('all')
  const filtered = filterByPeriod(data.matches, period)
  const stats = computeStats(filtered, data.players)

  return (
    <div className="space-y-4">
      <FilterBar period={period} onPeriod={setPeriod} onExport={exportAll} onImport={onImport} />
      <StatCards matches={filtered} players={data.players} />
      <TopSeeds stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Leaderboard stats={stats} />
        <MatchList matches={data.matches} onDelete={actions.deleteMatch} onLogMatch={() => onNavigate('log')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VideoSection videos={data.videos} onAdd={actions.addVideo} onDelete={actions.deleteVideo} />
        <PhotoGallery photos={data.photos} onAdd={actions.addPhoto} onDelete={actions.deletePhoto} />
      </div>
    </div>
  )
}
