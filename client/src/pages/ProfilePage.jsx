import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useUpdateProfile, useChangePassword } from '@/features/auth/hooks/useAuth'
import Spinner from '@/components/ui/Spinner'

function Alert({ type, message, onDismiss }) {
  if (!message) return null
  const isError = type === 'error'
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-xl text-sm border ${
      isError
        ? 'bg-red-500/10 border-red-500/20 text-red-400'
        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    }`}>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity mt-0.5 text-xs">✕</button>
    </div>
  )
}

const ROLE_LABELS = { ADMIN: 'Administrator', USER: 'User' }

export default function ProfilePage() {
  const user = useAuthStore(s => s.user)
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile()
  const { mutate: changePassword, isPending: isChanging } = useChangePassword()

  const [nameForm, setNameForm]   = useState({ name: user?.name || '' })
  const [nameMsg, setNameMsg]     = useState(null)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwMsg, setPwMsg]   = useState(null)

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleNameSave = (e) => {
    e.preventDefault()
    setNameMsg(null)
    if (!nameForm.name.trim() || nameForm.name.trim() === user?.name) return
    updateProfile(
      { name: nameForm.name.trim() },
      {
        onSuccess: () => setNameMsg({ type: 'success', text: 'Name updated successfully.' }),
        onError: (err) => setNameMsg({ type: 'error', text: err?.response?.data?.error || 'Update failed.' }),
      }
    )
  }

  const handlePasswordSave = (e) => {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwMsg({ type: 'error', text: 'New passwords do not match.' })
    }
    changePassword(
      { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword },
      {
        onSuccess: () => {
          setPwMsg({ type: 'success', text: 'Password changed successfully.' })
          setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        },
        onError: (err) => setPwMsg({ type: 'error', text: err?.response?.data?.error || 'Password change failed.' }),
      }
    )
  }

  const EyeIcon = ({ show, toggle }) => (
    <button type="button" onClick={toggle} className="text-[#454A68] hover:text-[#8890B0] transition-colors">
      {show ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
        <p className="text-[#8890B0] text-sm mt-1">Manage your account information</p>
      </div>

      {/* Avatar card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ring-4 ring-emerald-500/10">
          {(user?.name || 'U').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-white font-semibold text-lg">{user?.name}</p>
          <p className="text-[#8890B0] text-sm">{user?.email}</p>
          <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-widest uppercase ${
            user?.role === 'ADMIN'
              ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
        </div>
      </div>

      {/* Edit name */}
      <div className="card p-6 space-y-5">
        <h2 className="text-white font-semibold text-sm">Account Information</h2>

        <Alert
          type={nameMsg?.type}
          message={nameMsg?.text}
          onDismiss={() => setNameMsg(null)}
        />

        <form onSubmit={handleNameSave} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[#8890B0] text-xs font-semibold uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="input-field opacity-50 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[#8890B0] text-xs font-semibold uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={nameForm.name}
              onChange={e => setNameForm({ name: e.target.value })}
              className="input-field"
              placeholder="Your display name"
              required
              minLength={2}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdating || !nameForm.name.trim() || nameForm.name.trim() === user?.name}
              className="btn-primary px-5 py-2.5 text-sm rounded-xl disabled:opacity-40"
            >
              {isUpdating ? <><Spinner size="sm" /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6 space-y-5">
        <div>
          <h2 className="text-white font-semibold text-sm">Change Password</h2>
          <p className="text-[#454A68] text-xs mt-1">
            Must be 8+ characters with uppercase, lowercase, 2 numbers, and a special character.
          </p>
        </div>

        <Alert
          type={pwMsg?.type}
          message={pwMsg?.text}
          onDismiss={() => setPwMsg(null)}
        />

        <form onSubmit={handlePasswordSave} className="space-y-4">
          {[
            { label: 'Current Password',  key: 'currentPassword', show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: 'New Password',      key: 'newPassword',     show: showNew,     toggle: () => setShowNew(v => !v)     },
            { label: 'Confirm Password',  key: 'confirmPassword', show: showConfirm, toggle: () => setShowConfirm(v => !v) },
          ].map(({ label, key, show, toggle }) => (
            <div key={key} className="space-y-2">
              <label className="block text-[#8890B0] text-xs font-semibold uppercase tracking-wider">{label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pwForm[key]}
                  onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                  className="input-field pr-10"
                  required
                  placeholder="••••••••"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <EyeIcon show={show} toggle={toggle} />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isChanging || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
              className="btn-primary px-5 py-2.5 text-sm rounded-xl disabled:opacity-40"
            >
              {isChanging ? <><Spinner size="sm" /> Updating…</> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}
