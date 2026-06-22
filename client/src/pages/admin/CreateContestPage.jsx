import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCreateContest } from '@/features/contests/hooks/useContests'
import DateTimePicker from '@/components/ui/DateTimePicker'
import Spinner from '@/components/ui/Spinner'

export default function CreateContestPage() {
  const navigate = useNavigate()
  const { mutate: createContest, isPending, error } = useCreateContest()
  const [form, setForm] = useState({ title: '', description: '', start_time: null, end_time: null })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.start_time || !form.end_time) return
    createContest({
      title:       form.title,
      description: form.description,
      start_time:  form.start_time.toISOString(),
      end_time:    form.end_time.toISOString(),
    }, { onSuccess: () => navigate('/admin/contests') })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/contests"
          className="flex items-center gap-1.5 text-[#8890B0] hover:text-white transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Contest</h1>
          <p className="text-[#8890B0] text-sm mt-0.5">Set up a new coding contest</p>
        </div>
      </div>

      {/* Form card */}
      <div className="card p-6 space-y-6">

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error.message}
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <label className="block text-[#8890B0] text-xs font-semibold uppercase tracking-wider">
            Contest Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Weekly Code Challenge #12"
            className="input-field"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-[#8890B0] text-xs font-semibold uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Brief description of the contest (optional)"
            className="input-field resize-none"
          />
        </div>

        {/* Date pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <DateTimePicker
            label="Start Time *"
            value={form.start_time}
            onChange={val => setForm(f => ({ ...f, start_time: val }))}
            placeholder="Pick start date & time"
          />
          <DateTimePicker
            label="End Time *"
            value={form.end_time}
            onChange={val => setForm(f => ({ ...f, end_time: val }))}
            placeholder="Pick end date & time"
            minDate={form.start_time}
          />
        </div>

        {/* Validation hint */}
        {form.start_time && form.end_time && form.end_time <= form.start_time && (
          <p className="text-amber-400 text-xs flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            End time must be after start time
          </p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isPending ||
            !form.title.trim() ||
            !form.start_time ||
            !form.end_time ||
            form.end_time <= form.start_time
          }
          className="btn-primary w-full py-3 rounded-xl text-sm"
        >
          {isPending ? <Spinner size="sm" /> : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
          {isPending ? 'Creating…' : 'Create Contest'}
        </button>
      </div>
    </div>
  )
}
