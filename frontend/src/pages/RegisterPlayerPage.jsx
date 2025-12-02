// File: frontend/src/pages/RegisterPlayerPage.jsx

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPlayerPage() {
  const { registerPlayer } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    birth_date: '',
    email: '',
    password: '',
    location: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await registerPlayer(form)
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h1 className="text-xl font-semibold mb-4">Registro de jugador</h1>
      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <div className="flex-1 text-sm space-y-1">
            <label className="block">Nombre</label>
            <input
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex-1 text-sm space-y-1">
            <label className="block">Apellido</label>
            <input
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 text-sm space-y-1">
            <label className="block">DNI</label>
            <input
              name="dni"
              value={form.dni}
              onChange={handleChange}
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex-1 text-sm space-y-1">
            <label className="block">Fecha de nacimiento</label>
            <input
              type="date"
              name="birth_date"
              value={form.birth_date}
              onChange={handleChange}
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        <div className="text-sm space-y-1">
          <label className="block">Ubicación</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
            placeholder="Buenos Aires, CABA, etc."
            required
          />
        </div>

        <div className="text-sm space-y-1">
          <label className="block">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="text-sm space-y-1">
          <label className="block">Contraseña</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-sm py-2 font-medium disabled:opacity-60"
        >
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-400">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="text-sky-400 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}
