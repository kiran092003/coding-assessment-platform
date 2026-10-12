import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuestion } from '@/features/questions/hooks/useQuestions'
import { useTestCases, useCreateTestCase, useDeleteTestCase } from '@/features/testcases/hooks/useTestCases'

import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function TestCasesPage() {
  const { id } = useParams()
  const { data: question } = useQuestion(id)
  const { data: testCases, isLoading } = useTestCases(id)
  const { mutate: createTestCase, isPending: isCreating } = useCreateTestCase()
  const { mutate: deleteTestCase, isPending: isDeleting } = useDeleteTestCase()
  const [form, setForm]       = useState({ inputData: '', expectedOutput: '', isHidden: false })
  const [pending, setPending] = useState(null)

  const cases  = testCases || []
  const hidden = cases.filter(tc => tc.is_hidden)
  const sample = cases.filter(tc => !tc.is_hidden)

  const handleCreate = (e) => {
    e.preventDefault()
    createTestCase(
      {
        questionId: id,
        inputData: form.inputData,
        expectedOutput: form.expectedOutput,
        isHidden: form.isHidden,
      },
      { onSuccess: () => setForm({ inputData: '', expectedOutput: '', isHidden: false }) }
    )
  }

  const confirmDelete = () => {
    deleteTestCase(pending.id)
    setPending(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/questions"
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-display-lg text-on-surface">
            {question?.title || <span className="opacity-40">Loading…</span>}
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Test cases — {sample.length} sample, {hidden.length} hidden
          </p>
        </div>
      </div>

      {/* Existing test cases */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-high">
          <h2 className="text-on-surface font-semibold text-sm">Test Cases</h2>
          <span className="text-outline text-xs">{cases.length} total</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (!testCases || testCases.length === 0) ? (
          <div className="py-14 text-center">
            <div className="mb-3"><span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--outline)' }}>science</span></div>
            <p className="text-on-surface-variant text-sm">No test cases yet.</p>
            <p className="text-outline text-xs mt-1">Add one using the form below.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#0b0e14]">
            {cases.map((tc, idx) => (
              <div key={tc.id} className="p-5 hover:bg-surface-container transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-outline text-xs font-semibold uppercase tracking-wider">
                      Test Case #{idx + 1}
                    </span>
                    {tc.is_hidden
                      ? <span className="chip chip-system">Hidden</span>
                      : <span className="chip chip-neutral">Sample</span>}
                  </div>
                  <button
                    onClick={() => setPending({ id: tc.id, idx: idx + 1 })}
                    disabled={isDeleting}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 disabled:opacity-50 transition-all"
                  >
                    Delete
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-outline text-xs font-semibold uppercase tracking-wider mb-2">Input</p>
                    <pre className="bg-surface border border-surface-container-high rounded-lg p-3 text-emerald-400 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                      {tc.input_data || tc.inputData}
                    </pre>
                  </div>
                  <div>
                    <p className="text-outline text-xs font-semibold uppercase tracking-wider mb-2">Expected Output</p>
                    <pre className="bg-surface border border-surface-container-high rounded-lg p-3 text-emerald-400 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                      {tc.expected_output || tc.expectedOutput}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add test case form */}
      <div className="card p-6 space-y-5">
        <h2 className="text-on-surface font-semibold text-sm">Add Test Case</h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              Input Data <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              value={form.inputData}
              onChange={e => setForm(f => ({ ...f, inputData: e.target.value }))}
              rows={4}
              placeholder="e.g.  [2,7,11,15]\n9"
              className="input-field font-mono resize-y"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              Expected Output <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              value={form.expectedOutput}
              onChange={e => setForm(f => ({ ...f, expectedOutput: e.target.value }))}
              rows={3}
              placeholder="e.g.  [0,1]"
              className="input-field font-mono resize-y"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded border p-3"
                 style={{ borderColor: 'var(--outline-variant)', background: 'var(--surface-container)' }}>
            <input
              type="checkbox"
              checked={form.isHidden}
              onChange={e => setForm(f => ({ ...f, isHidden: e.target.checked }))}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[color:var(--primary)]"
            />
            <span>
              <span className="block text-body-md text-on-surface">Hidden test case</span>
              <span className="block text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                Hidden cases decide the verdict and are never sent to solvers. Sample cases are
                shown on the problem page as worked examples.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={isCreating}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm"
          >
            {isCreating ? <Spinner size="sm" /> : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
            {isCreating ? 'Saving…' : 'Save Test Case'}
          </button>
        </form>
      </div>

      {pending && (
        <ConfirmDialog
          title="Delete test case?"
          message={`Test Case #${pending.idx} will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}
