import React, { useState, useEffect } from 'react'
import api from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('auth')) navigate('/dashboard')
  }, [])

  function handle(e) {
    e.preventDefault()
    api.post('/auth/login', { email, password })
      .then((res) => {
        localStorage.setItem('auth', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        window.dispatchEvent(new Event('auth-change'))
        navigate('/dashboard')
      })
      .catch((err) => {
        console.error(err)
        const msg = err.response?.data?.message || 'Login failed'
        alert(msg)
      })
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-3xl font-bold mb-6 text-center">Welcome Back</h2>
      <form onSubmit={handle} className="space-y-4 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none" required />
        </div>
        <button className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors">Login</button>
      </form>
    </div>
  )
}
