import { useEffect, useRef, useState } from 'react'
import { socket } from '../lib/socket.js'

/**
 * Hook to collect real-time Socket.IO events into a timeline
 * @param {string} farmId
 * @returns {{ events: Array, clear: Function }}
 */
export function useActivityTimeline(farmId) {
  const [events, setEvents] = useState([])
  const counterRef = useRef(0)

  const addEvent = (icon, message, type = 'info') => {
    const id = ++counterRef.current
    setEvents(prev => [{
      id,
      icon,
      message,
      type,
      timestamp: new Date(),
    }, ...prev].slice(0, 50)) // keep last 50 events
  }

  useEffect(() => {
    if (!farmId) return

    const handlers = {
      'reading:received': (data) => {
        if (data.farmId !== farmId) return
        addEvent('📡', `New reading received — Soil EC: ${data.soilEC} dS/m (${data.source})`, 'info')
      },
      'risk:assessed': (data) => {
        if (data.farmId !== farmId) return
        addEvent('⚖️', `Risk assessed: ${data.riskLevel} (score ${data.riskScore}) — ${data.trend}`, 
          data.riskLevel === 'CRITICAL' ? 'critical' : data.riskLevel === 'HIGH' ? 'danger' : 'info')
      },
      'orchestrator:started': (data) => {
        if (data.farmId !== farmId) return
        addEvent('🤖', `Agent Orchestrator started — activating: ${data.agents?.join(', ')}`, 'info')
      },
      'agent:started': (data) => {
        if (data.farmId !== farmId) return
        addEvent('⚙️', `${data.agentName} activated`, 'info')
      },
      'agent:completed': (data) => {
        if (data.farmId !== farmId) return
        addEvent('✅', `${data.agentName} completed${data.isDemo ? ' (demo mode)' : ' — IBM Granite analysis done'}`, 'success')
      },
      'agent:failed': (data) => {
        if (data.farmId !== farmId) return
        addEvent('❌', `${data.agentName} failed: ${data.error}`, 'danger')
      },
      'alert:created': (data) => {
        if (data.farmId !== farmId) return
        addEvent('🚨', `Alert created: ${data.severity} — ${data.title}`, 
          data.severity === 'CRITICAL' ? 'critical' : 'danger')
      },
      'orchestrator:completed': (data) => {
        if (data.farmId !== farmId) return
        addEvent('🏁', `Analysis complete — ${data.agentsRan?.length || 0} agents ran`, 'success')
      },
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler)
    })

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler)
      })
    }
  }, [farmId])

  return {
    events,
    clear: () => setEvents([]),
  }
}
