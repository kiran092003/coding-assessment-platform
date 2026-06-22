import { useQuery, useMutation } from '@tanstack/react-query'
import {
  getAllContests, getContestById, createContest, updateContest, deleteContest,
  registerForContest, getMyRegistration,
  getContestQuestions, addContestQuestion, removeContestQuestion, updateContestQuestionPoints
} from '../api/contestsApi'
import { queryClient } from '@/lib/queryClient'

export const useAllContests = () => useQuery({ queryKey: ['contests'], queryFn: getAllContests })
export const useContest = (id) => useQuery({ queryKey: ['contests', id], queryFn: () => getContestById(id), enabled: !!id })
export const useCreateContest = () => useMutation({ mutationFn: createContest, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contests'] }) })
export const useUpdateContest = () => useMutation({ mutationFn: ({ id, data }) => updateContest(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contests'] }) })
export const useDeleteContest = () => useMutation({ mutationFn: deleteContest, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contests'] }) })

export const useMyRegistration = (id) => useQuery({
  queryKey: ['registration', id],
  queryFn: () => getMyRegistration(id),
  enabled: !!id,
  staleTime: 30_000,
})
export const useRegisterContest = (id) => useMutation({
  mutationFn: () => registerForContest(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['registration', id] }),
})

export const useContestQuestions = (contestId) => useQuery({ queryKey: ['contest-questions', contestId], queryFn: () => getContestQuestions(contestId), enabled: !!contestId })
export const useAddContestQuestion = () => useMutation({ mutationFn: addContestQuestion, onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['contest-questions', variables.contestId] }) })
export const useRemoveContestQuestion = () => useMutation({ mutationFn: ({ contestId, questionId }) => removeContestQuestion(contestId, questionId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contest-questions'] }) })
export const useUpdateContestQuestionPoints = () => useMutation({ mutationFn: ({ contestId, questionId, data }) => updateContestQuestionPoints(contestId, questionId, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contest-questions'] }) })
