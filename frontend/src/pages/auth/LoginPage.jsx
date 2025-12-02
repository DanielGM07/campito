// File: src/pages/auth/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/* ------------------ MODAL PARA PROVEEDORES NO APROBADOS ------------------ */
function PendingApprovalModal({ message, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 20,
          textAlign: "center",
          borderRadius: 18,
        }}
      >
        <h2 className="auth-title" style={{ marginBottom: 6 }}>
          Solicitud pendiente
        </h2>
        <p className="auth-subtitle" style={{ marginBottom: 18 }}>
          {message || "Tu cuenta aún no fue aprobada por un administrador."}
        </p>

        <button className="btn btn-primary" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  )
}

/* ------------------------------ LOGIN PAGE ------------------------------ */

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Para mostrar el modal de proveedor no aprobado
  const [pendingModal, setPendingModal] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (e2) {
      // Si backend devuelve 403 con mensaje de proveedor pendiente
      if (e2.status === 403 && e2.message.includes("pendiente")) {
        setPendingModal(e2.message)
      } else {
        setError(e2.message)
      }
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

        <div className="auth-footer-text" style={{ marginTop: 16 }}>
          ¿No tenés cuenta?
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            
            <Link
              to="/register"
              className="auth-link"
              style={{ fontSize: 13, textAlign: "center" }}
            >
              Registrarme como jugador
            </Link>

            <Link
              to="/register/provider"
              className="auth-link"
              style={{
                fontSize: 13,
                textAlign: "center",
                color: "var(--neon)",
              }}
            >
              Registrarme como proveedor
            </Link>
          </div>
        </div>
      </div>

      {/* ---------- MODAL ---------- */}
      {pendingModal && (
        <PendingApprovalModal
          message={pendingModal}
          onClose={() => setPendingModal(null)}
        />
      )}
    </div>
  )
}
