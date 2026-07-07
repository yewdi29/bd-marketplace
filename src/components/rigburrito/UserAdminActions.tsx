'use client'

import { useState } from 'react'
import AdminButton from '@/components/rigburrito/AdminButton'
import HoldToConfirmButton from '@/components/rigburrito/HoldToConfirmButton'
import { formatActiveListingDisplay } from '@/lib/planLimits'
import type { AdminUserRow } from '@/lib/rigburrito/types'
import type { MembershipPlan } from '@/lib/types/database'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface UserAdminActionsProps {
  user: AdminUserRow
  onUpdated: () => void
  onDeleted?: () => void
}

export default function UserAdminActions({ user, onUpdated, onDeleted }: UserAdminActionsProps) {
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')
  const [emailError, setEmailError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')

  const emailValid = EMAIL_RE.test(newEmail.trim())

  async function updateUser(field: string, value: unknown) {
    const res = await fetch(`/api/rigburrito/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    onUpdated()
  }

  async function changeEmail() {
    if (!emailValid) return
    setEmailLoading(true)
    setEmailError('')
    setEmailMessage('')
    try {
      const res = await fetch(`/api/rigburrito/users/${user.id}/change-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEmailMessage('Email updated successfully')
      setShowEmailForm(false)
      setNewEmail('')
      onUpdated()
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to update email')
    } finally {
      setEmailLoading(false)
    }
  }

  async function sendPasswordReset() {
    setResetLoading(true)
    setResetError('')
    setResetMessage('')
    try {
      const res = await fetch(`/api/rigburrito/users/${user.id}/password-reset`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResetMessage(`Password reset email sent to ${user.email}`)
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setResetLoading(false)
    }
  }

  async function deleteUser() {
    const res = await fetch(`/api/rigburrito/users/${user.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    onDeleted?.()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="rigburrito-card-label mb-3">Customer Support</p>
        <div className="space-y-3">
          {!showEmailForm ? (
            <AdminButton variant="secondary" onClick={() => { setShowEmailForm(true); setEmailError(''); setEmailMessage('') }}>
              Change Email
            </AdminButton>
          ) : (
            <div className="space-y-2 rounded-lg border border-[#F0F1F3] p-3">
              <label htmlFor={`email-${user.id}`} className="rigburrito-card-label">New email address</label>
              <input
                id={`email-${user.id}`}
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="rigburrito-input"
                placeholder="user@example.com"
              />
              <div className="flex flex-wrap gap-2">
                <AdminButton
                  variant="primary"
                  onClick={changeEmail}
                  disabled={!emailValid || emailLoading}
                >
                  {emailLoading ? 'Updating...' : 'Confirm Change'}
                </AdminButton>
                <AdminButton variant="secondary" onClick={() => { setShowEmailForm(false); setNewEmail(''); setEmailError('') }}>
                  Cancel
                </AdminButton>
              </div>
            </div>
          )}
          {emailMessage && <p className="text-sm" style={{ color: '#16A34A' }}>{emailMessage}</p>}
          {emailError && <p className="text-sm text-red-500">{emailError}</p>}

          <AdminButton variant="secondary" onClick={sendPasswordReset} disabled={resetLoading}>
            {resetLoading ? 'Sending...' : 'Send Password Reset'}
          </AdminButton>
          {resetMessage && <p className="text-sm" style={{ color: '#16A34A' }}>{resetMessage}</p>}
          {resetError && <p className="text-sm text-red-500">{resetError}</p>}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #F0F1F3', margin: 0 }} />

      <div>
        <p className="rigburrito-card-label mb-2">Override Plan</p>
        <select
          value={user.plan}
          onChange={e => updateUser('plan', e.target.value as MembershipPlan)}
          className="rigburrito-select"
          style={{ width: '100%', maxWidth: 280 }}
        >
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="max">Max</option>
        </select>
        <p className="rigburrito-caption mt-2" style={{ color: '#6B7280' }}>
          {formatActiveListingDisplay(user.plan, user.listing_count)} active
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {user.suspended ? (
          <AdminButton variant="secondary" onClick={() => updateUser('suspended', false)}>Unsuspend</AdminButton>
        ) : (
          <AdminButton variant="danger" onClick={() => updateUser('suspended', true)}>Suspend Account</AdminButton>
        )}
        <HoldToConfirmButton label="Delete User" onConfirm={deleteUser} />
      </div>
    </div>
  )
}
