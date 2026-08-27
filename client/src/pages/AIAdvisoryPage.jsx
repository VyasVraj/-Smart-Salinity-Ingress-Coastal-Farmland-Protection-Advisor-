import { useState } from 'react'
import { Cpu } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { AIChatAdvisor } from '../components/AIChatAdvisor.jsx'
import { DemoBadge } from '../components/ui/Badges.jsx'

export default function AIAdvisoryPage() {
  const { data: farms = [] } = useFarms()
  const [farmId, setFarmId] = useState('')
  const activeFarmId = farmId || farms[0]?.id || ''
  const activeFarm = farms.find(f => f.id === activeFarmId)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="text-blue-400" size={22} /> AI Farm Advisor
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask questions about your farm — answers use your actual data, risk levels, and AI advisories.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-500">Select Farm:</label>
        <select
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          value={activeFarmId}
          onChange={e => setFarmId(e.target.value)}
        >
          {farms.map(f => <option key={f.id} value={f.id}>{f.farmName} ({f.district})</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {activeFarm ? (
          <AIChatAdvisor farmId={activeFarmId} farmName={activeFarm.farmName} />
        ) : (
          <div className="p-8 text-center text-gray-600 text-sm">
            Loading farms...
          </div>
        )}
      </div>

      <div className="card p-4 bg-blue-500/5 border-blue-500/20 text-xs text-gray-500">
        <strong className="text-blue-400">IBM Granite AI</strong> — Chat responses are powered by IBM Granite LLM via watsonx.ai.
        When IBM credentials are configured, the AI uses your actual farm data, recent readings, risk assessments, 
        and existing advisories to give contextual answers.
      </div>
    </div>
  )
}
