import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NavBar() {
  const [authed, setAuthed] = useState(false)
  useEffect(() => {
    const checkAuth = () => setAuthed(!!localStorage.getItem('auth'))
    checkAuth()

    window.addEventListener('auth-change', checkAuth)
    return () => window.removeEventListener('auth-change', checkAuth)
  }, [])

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <motion.div whileHover={{ scale: 1.02 }} className="text-xl font-semibold">
          <Link to="/">Linktree</Link>
        </motion.div>
        <div className="space-x-4 flex items-center">
          {authed && (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <button className="text-sm text-red-600 font-medium hover:text-red-700 ml-4" onClick={() => {
                localStorage.removeItem('auth');
                localStorage.removeItem('user');
                setAuthed(false);
                window.dispatchEvent(new Event('auth-change'));
                window.location.href = '/login'
              }}>Logout</button>
            </>
          )}
          {!authed && (
            <>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Login</Link>
              <Link to="/register" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
