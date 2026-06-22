import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCreateQuestion } from '@/features/questions/hooks/useQuestions'
import Spinner from '@/components/ui/Spinner'

const RETURN_TYPES = ['int', 'long long', 'double', 'bool', 'string', 'vector<int>', 'vector<string>', 'vector<vector<int>>', 'void']

const FieldLabel = ({ children }) => (
  <label className="block text-sm font-medium mb-1.5" style={{ color: '#8890B0' }}>{children}</label>
)

export default function CreateQuestionPage() {
  const navigate = useNavigate()
  const { mutate: createQuestion, isPending, error } = useCreateQuestion()
  const [form, setForm] = useState({ title: '', description: '', difficluty: 'Low', return_type: 'int', params: '' })
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    createQuestion(form, { onSuccess: () => navigate('/admin/questions') })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/admin/questions" className="p-2 rounded-lg hover:bg-[#171828] text-[#8890B0] hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Create Question</h1>
          <p className="text-[#454A68] text-sm">Add a new coding problem</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error.response?.data?.error || error.message}
          </div>
        )}

        <div>
          <FieldLabel>Title</FieldLabel>
          <input
            required
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Two Sum"
            className="input-field"
          />
        </div>

        <div>
          <FieldLabel>Description</FieldLabel>
          <textarea
            required
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={10}
            placeholder="Problem description, constraints, examples..."
            className="input-field resize-y font-mono text-xs leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Difficulty</FieldLabel>
            <select value={form.difficluty} onChange={e => set('difficluty', e.target.value)} className="input-field">
              <option value="Low">Easy</option>
              <option value="Medium">Medium</option>
              <option value="High">Hard</option>
            </select>
          </div>

          <div>
            <FieldLabel>Return Type</FieldLabel>
            <select value={form.return_type} onChange={e => set('return_type', e.target.value)} className="input-field font-mono text-xs">
              {RETURN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel>Parameters (C++ syntax)</FieldLabel>
          <input
            value={form.params}
            onChange={e => set('params', e.target.value)}
            placeholder='e.g.  string s   or   vector<int>& nums, int target'
            className="input-field font-mono text-xs"
          />
          <p className="text-[#454A68] text-xs mt-1.5">
            Write in C++ style. Used to generate function signatures in all languages.
            Leave empty if no parameters.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={isPending} className="btn-primary flex items-center gap-2">
            {isPending && <Spinner size="sm" />}
            {isPending ? 'Creating...' : 'Create Question'}
          </button>
          <Link to="/admin/questions" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
