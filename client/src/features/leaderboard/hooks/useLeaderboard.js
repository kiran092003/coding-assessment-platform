import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { getLeaderboard, getMyEntry } from '../api/leaderboardApi'

export const useLeaderboardQuery = (contestId) => useQuery({
  queryKey: ['leaderboard', contestId],
  queryFn: () => getLeaderboard(contestId),
  enabled: !!contestId
})

export const useMyContestEntry = (contestId) => useQuery({
  queryKey: ['leaderboard-me', contestId],
  queryFn: () => getMyEntry(contestId),
  enabled: !!contestId,
  staleTime: 30_000,
})

export const useRealtimeLeaderboard = (contestId) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!contestId) return
    const socket = io('http://localhost:4006')
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.emit('joinContest', contestId)
    socket.on('leaderboardUpdate', setLeaderboard)
    return () => {
      socket.emit('leaveContest', contestId)
      socket.disconnect()
    }
  }, [contestId])

  return { leaderboard, connected }
}
