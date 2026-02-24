import React, { useState, useEffect } from 'react'
import api from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('auth')) navigate('/dashboard')
  }, [])

  function handle(e) {
    e.preventDefault()
    // Simple validation
    if (username.includes(' ')) {
      alert("Username cannot contain spaces")
      return
    }

    api.post('/auth/register', { name, username, email, password })
      .then((res) => {
        localStorage.setItem('auth', res.data.token) // Updated to store token
        localStorage.setItem('user', JSON.stringify(res.data.user)) // Store user info
        window.dispatchEvent(new Event('auth-change'))
        navigate('/dashboard')
      })
      .catch((err) => {
        console.error(err)
        const msg = err.response?.data?.message || 'Registration failed'
        alert(msg)
      })
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-3xl font-bold mb-6 text-center">Create your LinkHub</h2>
      <form onSubmit={handle} className="space-y-4 bg-white p-8 rounded-xl shadow-lg border border-gray-100" autoComplete="off">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">linkhub.com/</span>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              className="w-full pl-28 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Doe" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="jane@example.com" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none" required />
        </div>
        <button type="submit" className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors">Create account</button>
      </form>
    </div>
  )
}
