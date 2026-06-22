import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { createSubmission, getSubmissionById, getMySubmissions, getAllMySubmissions, runCode as runCodeApi } from '../api/submissionsApi'

const TERMINAL_STATUSES = ['ACCEPTED', 'WRONG_ANSWER', 'COMPILATION_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR']

export const useAllMySubmissions = () => useQuery({
  queryKey: ['submissions', 'all'],
  queryFn: getAllMySubmissions,
  staleTime: 30_000,
})

export const useMySubmissions = (questionId, contestId = null) => useQuery({
  queryKey: ['submissions', questionId, contestId],
  queryFn: () => getMySubmissions(questionId, contestId),
  enabled: !!questionId
})

export const useSubmitCode = () => {
  const [submissionId, setSubmissionId] = useState(null)
  const [result, setResult] = useState(null)
  const [isPolling, setIsPolling] = useState(false)

  const { data: pollingData } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => getSubmissionById(submissionId),
    enabled: !!submissionId && isPolling,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (!status || !TERMINAL_STATUSES.includes(status)) return 2000
      return false
    },
  })

  // Stop polling and save result when a terminal status arrives
  useEffect(() => {
    if (pollingData && TERMINAL_STATUSES.includes(pollingData.status)) {
      setResult(pollingData)
      setIsPolling(false)
    }
  }, [pollingData])

  const submit = useMutation({
    mutationFn: createSubmission,
    onSuccess: (data) => {
      setSubmissionId(data.submissionId)
      setIsPolling(true)
      setResult(null)
    }
  })

  const clearResult = () => {
    setResult(null)
    setIsPolling(false)
    setSubmissionId(null)
  }

  return { submit, result, isPolling, clearResult }
}

export const useRunCode = () => {
  const [result, setResult] = useState(null)

  const run = useMutation({
    mutationFn: runCodeApi,
    onSuccess: (data) => setResult(data),
  })

  const clearResult = () => setResult(null)

  return { run, result, clearResult }
}
