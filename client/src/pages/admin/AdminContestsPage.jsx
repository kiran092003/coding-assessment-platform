import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAllContests, useDeleteContest } from '@/features/contests/hooks/useContests'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

function getContestStatus(contest) {
  const now = new Date()
  if (now < new Date(contest.start_time)) return 'Upcoming'
  if (now > new Date(contest.end_time))   return 'Ended'
  return 'Active'
}

function statusVariant(s) {
  if (s === 'Active')   return 'success'
  if (s === 'Upcoming') return 'info'
  return 'default'
}

export default function AdminContestsPage() {
  const { data: contests, isLoading } = useAllContests()
  const { mutate: deleteContest, isPending: isDeleting } = useDeleteContest()
  const [pending, setPending] = useState(null) // { id, title }

  const handleDelete = (id, title) => setPending({ id, title })
  const confirmDelete = () => { deleteContest(pending.id); setPending(null) }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contests</h1>
          <p className="text-[#8890B0] text-sm mt-0.5">Manage all contests</p>
        </div>
        <Link to="/admin/contests/create" className="btn-primary text-sm px-4 py-2">
          + Create Contest
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : (
        <div className="tbl-wrap">
          <div className="tbl-head grid grid-cols-[1fr_120px_160px_160px_200px] px-5 py-3">
            {['Title', 'Status', 'Start', 'End', 'Actions'].map(h => (
              <span key={h} className="text-[#454A68] text-xs font-semibold uppercase tracking-wider last:text-right">{h}</span>
            ))}
          </div>

          {(contests || []).map(c => {
            const status = getContestStatus(c)
            return (
              <div key={c.id} className="tbl-row grid grid-cols-[1fr_120px_160px_160px_200px] px-5 py-3.5 items-center">
                <span className="text-white text-sm font-medium truncate pr-4">{c.title}</span>
                <div><Badge variant={statusVariant(status)}>{status}</Badge></div>
                <span className="text-[#8890B0] text-xs">{format(new Date(c.start_time), 'MMM dd, yyyy HH:mm')}</span>
                <span className="text-[#8890B0] text-xs">{format(new Date(c.end_time), 'MMM dd, yyyy HH:mm')}</span>
                <div className="flex items-center justify-end gap-1.5">
                  <Link to={`/admin/contests/${c.id}/edit`}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                    Edit
                  </Link>
                  <Link to={`/admin/contests/${c.id}/questions`}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
                    Problems
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id, c.title)}
                    disabled={isDeleting}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                    Delete
                  </button>
                </div>
              </div>
            )
          })}

          {(!contests || contests.length === 0) && (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-[#8890B0] text-sm">No contests yet.</p>
              <Link to="/admin/contests/create" className="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block transition-colors">
                Create your first contest →
              </Link>
            </div>
          )}
        </div>
      )}

      {pending && (
        <ConfirmDialog
          title="Delete contest?"
          message={`"${pending.title}" will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}
