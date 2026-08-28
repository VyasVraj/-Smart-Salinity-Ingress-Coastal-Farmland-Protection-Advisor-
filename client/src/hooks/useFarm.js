import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { socket } from '../lib/socket.js'
import { api } from '../lib/api.js'

/**
 * Hook to get all farms with auto-refresh on socket events
 */
export function useFarms() {
  const query = useQuery({
    queryKey: ['farms'],
    queryFn: api.farms.list,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const refresh = () => query.refetch()
    socket.on('risk:assessed', refresh)
    socket.on('reading:received', refresh)
    socket.on('alert:created', refresh)
    return () => {
      socket.off('risk:assessed', refresh)
      socket.off('reading:received', refresh)
      socket.off('alert:created', refresh)
    }
  }, [query])

  return query
}

/**
 * Hook to get a single farm with all details
 */
export function useFarm(farmId) {
  const query = useQuery({
    queryKey: ['farm', farmId],
    queryFn: () => api.farms.get(farmId),
    enabled: !!farmId,
    refetchInterval: 15_000,
  })

  useEffect(() => {
    if (!farmId) return
    socket.emit('join:farm', farmId)

    const refresh = (data) => {
      if (data.farmId === farmId || !data.farmId) {
        query.refetch()
      }
    }

    const events = ['reading:received', 'risk:assessed', 'agent:completed', 'alert:created', 'orchestrator:completed']
    events.forEach(e => socket.on(e, refresh))

    return () => {
      events.forEach(e => socket.off(e, refresh))
      socket.emit('leave:farm', farmId)
    }
  }, [farmId, query])

  return query
}

/**
 * Hook to get historical readings for charts
 */
export function useFarmReadings(farmId, limit = 100) {
  return useQuery({
    queryKey: ['farm-readings', farmId, limit],
    queryFn: () => api.farms.readings(farmId, limit),
    enabled: !!farmId,
  })
}

/**
 * Hook to get agent runs (activity timeline)
 */
export function useAgentRuns(farmId) {
  const query = useQuery({
    queryKey: ['agent-runs', farmId],
    queryFn: () => api.farms.agentRuns(farmId),
    enabled: !!farmId,
    refetchInterval: 10_000,
  })

  useEffect(() => {
    if (!farmId) return
    const refresh = (data) => {
      if (data.farmId === farmId) query.refetch()
    }
    socket.on('agent:completed', refresh)
    socket.on('agent:started', refresh)
    socket.on('orchestrator:completed', refresh)
    return () => {
      socket.off('agent:completed', refresh)
      socket.off('agent:started', refresh)
      socket.off('orchestrator:completed', refresh)
    }
  }, [farmId, query])

  return query
}

/**
 * Mutation hook: create a new farm
 * On success, automatically refetches the farms list so the new farm
 * appears immediately everywhere (Dashboard, FarmsList, selectors…)
 *
 * @returns {UseMutationResult} — call .mutateAsync(farmData) with the form payload
 */
export function useCreateFarm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.farms.create(data),
    onSuccess: () => {
      // Invalidate the farms list so every component re-fetches
      queryClient.invalidateQueries({ queryKey: ['farms'] })
    },
  })
}
