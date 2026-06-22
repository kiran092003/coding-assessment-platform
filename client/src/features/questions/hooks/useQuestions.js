import { useQuery, useMutation } from '@tanstack/react-query'
import { getAllQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion } from '../api/questionsApi'
import { queryClient } from '@/lib/queryClient'

export const useAllQuestions = () => useQuery({ queryKey: ['questions'], queryFn: getAllQuestions })
export const useQuestion = (id) => useQuery({ queryKey: ['questions', id], queryFn: () => getQuestionById(id), enabled: !!id })
export const useCreateQuestion = () => useMutation({ mutationFn: createQuestion, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions'] }) })
export const useUpdateQuestion = () => useMutation({ mutationFn: ({ id, data }) => updateQuestion(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions'] }) })
export const useDeleteQuestion = () => useMutation({ mutationFn: deleteQuestion, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions'] }) })
