// File: src/pages/auth/RegisterPlayerPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
    } catch (e2) {
      setError(e2.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="badge" style={{ marginBottom: 8 }}>
            <span>🧾</span>
            <span>Registro de jugador</span>
          </div>
          <h1 className="auth-title">Creá tu cuenta</h1>
          <p className="auth-subtitle">
            Solo los jugadores se registran acá. Proveedores y admins se
            habilitan desde el panel.
          </p>
        </div>

        {error && (
          <div
            style={{
              fontSize: 12,
              marginBottom: 10,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(239,68,68,0.4)',
              background:
                'linear-gradient(135deg, rgba(127,29,29,0.24), transparent)',
              color: '#fecaca',
            }}
          >
            {error}
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-label">Nombre</label>
              <input
                name="first_name"
                className="field-input"
                value={form.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-label">Apellido</label>
              <input
                name="last_name"
                className="field-input"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-label">DNI</label>
              <input
                name="dni"
                className="field-input"
                value={form.dni}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="field-label">Fecha de nacimiento</label>
              <input
                type="date"
                name="birth_date"
                className="field-input"
                value={form.birth_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Ubicación</label>
            <input
              name="location"
              className="field-input"
              value={form.location}
              onChange={handleChange}
              placeholder="Buenos Aires, CABA, etc."
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Email</label>
            <input
              type="email"
              name="email"
              className="field-input"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Contraseña</label>
            <input
              type="password"
              name="password"
              className="field-input"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 4 }}
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-footer-text">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="auth-link">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
