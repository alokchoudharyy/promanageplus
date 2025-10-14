// src/pages/CompleteProfile.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function CompleteProfile() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || ''
      })
    }
  }, [profile, loading])

  // Redirect back if profile already completed
  useEffect(() => {
    if (!loading && profile && profile.full_name) {
      navigate('/dashboard') // or wherever
    }
  }, [profile, loading, navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
        },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')
      toast.success('Profile updated successfully')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="max-w-md mx-auto p-4 mt-16 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-6">Complete Your Profile</h2>
      <label className="block mb-4">
        Full Name
        <input
          name="full_name"
          className="w-full border rounded p-2 mt-1"
          type="text"
          value={form.full_name}
          onChange={handleChange}
          required
        />
      </label>
      <label className="block mb-4">
        Phone
        <input
          name="phone"
          className="w-full border rounded p-2 mt-1"
          type="tel"
          value={form.phone}
          onChange={handleChange}
        />
      </label>
      <label className="block mb-4">
        Avatar URL
        <input
          name="avatar_url"
          className="w-full border rounded p-2 mt-1"
          type="url"
          value={form.avatar_url}
          onChange={handleChange}
        />
      </label>

      <button
        disabled={saving}
        onClick={handleSave}
        className="btn-primary w-full py-2 mt-2"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  )
}
