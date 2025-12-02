// File: frontend/src/pages/LoginPage.jsx

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h1 className="text-xl font-semibold mb-4">Iniciar sesión</h1>
      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1 text-sm">
          <label className="block">Email</label>
          <input
            type="email"
            className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1 text-sm">
          <label className="block">Contraseña</label>
          <input
            type="password"
            className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-sm py-2 font-medium disabled:opacity-60"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-400">
        ¿No tenés cuenta?{' '}
        <Link to="/register" className="text-sky-400 hover:underline">
          Registrate como jugador
        </Link>
      </p>
    </div>
  )
}
