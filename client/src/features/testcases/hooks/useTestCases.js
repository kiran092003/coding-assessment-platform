import { useQuery, useMutation } from '@tanstack/react-query'
import { getTestCasesByQuestion, createTestCase, updateTestCase, deleteTestCase } from '../api/testcasesApi'
import { queryClient } from '@/lib/queryClient'

export const useTestCases = (questionId) => useQuery({
  queryKey: ['testcases', questionId],
  queryFn: () => getTestCasesByQuestion(questionId),
  enabled: !!questionId
})

export const useCreateTestCase = () => useMutation({
  mutationFn: createTestCase,
  onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['testcases', variables.questionId] })
})

export const useUpdateTestCase = () => useMutation({
  mutationFn: ({ id, data }) => updateTestCase(id, data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['testcases'] })
})

export const useDeleteTestCase = () => useMutation({
  mutationFn: deleteTestCase,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['testcases'] })
})
