// File: src/pages/auth/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
            <span>⚽</span>
            <span>Campito</span>
          </div>
          <h1 className="auth-title">Bienvenido de vuelta</h1>
          <p className="auth-subtitle">
            Iniciá sesión para ver tus reservas, equipos y torneos.
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
          <div className="field">
            <label className="field-label">Email</label>
            <input
              type="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Contraseña</label>
            <input
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 4 }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-footer-text">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="auth-link">
            Registrate como jugador
          </Link>
        </p>
      </div>
    </div>
  )
}
