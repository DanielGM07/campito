// File: src/pages/auth/RegisterProviderPage.jsx
import { useState } from "react"
import { api } from "../../api/http"
import { Link } from "react-router-dom"

export default function RegisterProviderPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    dni: "",
    birth_date: "",
    email: "",
    password: "",
    location: "",
    venue_name: "",
    contact_phone: "",
    contact_email: "",
    address: "",
    description: ""
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await api.post("auth_register_provider", form)
      setSuccess(true)
    } catch (err) {
      setError(err.message || "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Solicitud enviada</h1>
          <p className="auth-subtitle">
            Tu cuenta fue creada correctamente.<br />
            Un administrador deberá aprobar tu solicitud para activar tu panel de proveedor.
          </p>

          <Link to="/login" className="btn btn-primary" style={{ width: "100%", marginTop: 10 }}>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        
        {/* Header */}
        <div className="auth-header">
          <div className="badge" style={{ marginBottom: 8 }}>
            <span>🏢</span>
            <span>Registro proveedor</span>
          </div>

          <h1 className="auth-title">Crear cuenta de proveedor</h1>
          <p className="auth-subtitle">
            Ingresá tus datos personales y la información de tu complejo.
          </p>

          <Link
            to="/login"
            className="auth-link"
            style={{ display: "inline-block", marginTop: 6 }}
          >
            ← Volver a iniciar sesión
          </Link>
        </div>

        {error && (
          <div
            style={{
              fontSize: 12,
              marginBottom: 10,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(239,68,68,0.4)",
              background: "linear-gradient(135deg, rgba(127,29,29,0.24), transparent)",
              color: "#fecaca",
            }}
          >
            {error}
          </div>
        )}

        {/* DOS COLUMNAS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 18
          }}
        >
          {/* COLUMNA 1 - Datos personales */}
          <div className="field">
            <label className="field-label">Nombre</label>
            <input className="field-input" name="first_name" value={form.first_name} onChange={handleChange} required />
          </div>

          <div className="field">
            <label className="field-label">Apellido</label>
            <input className="field-input" name="last_name" value={form.last_name} onChange={handleChange} required />
          </div>

          <div className="field">
            <label className="field-label">DNI</label>
            <input className="field-input" name="dni" value={form.dni} onChange={handleChange} required />
          </div>

          <div className="field">
            <label className="field-label">Fecha de nacimiento</label>
            <input type="date" className="field-input" name="birth_date" value={form.birth_date} onChange={handleChange} required />
          </div>

          <div className="field">
            <label className="field-label">Email personal</label>
            <input type="email" className="field-input" name="email" value={form.email} onChange={handleChange} required />
          </div>

          <div className="field">
            <label className="field-label">Contraseña</label>
            <input type="password" className="field-input" name="password" value={form.password} onChange={handleChange} required />
          </div>

          <div className="field">
            <label className="field-label">Localidad</label> {/* Antes llamado Ubicacion */}
            <input className="field-input" name="location" value={form.location} onChange={handleChange} required />
          </div>

          {/* SEPARADOR VISUAL */}
          <div style={{ gridColumn: "1 / -1", height: 1, background: "rgba(148,163,184,0.35)", margin: "4px 0" }}></div>

          {/* COLUMNA 2 - Datos del complejo */}
          <div className="field">
            <label className="field-label">Nombre del complejo</label>
            <input className="field-input" name="venue_name" value={form.venue_name} onChange={handleChange} required />
          </div>

          <div className="field">
            <label className="field-label">Teléfono del complejo</label>
            <input className="field-input" name="contact_phone" value={form.contact_phone} onChange={handleChange} required />
          </div>

          <div className="field">
            <label className="field-label">Email del complejo</label>
            <input type="email" className="field-input" name="contact_email" value={form.contact_email} onChange={handleChange} required />
          </div>

          <div className="field">
            <label className="field-label">Dirección</label>
            <input className="field-input" name="address" value={form.address} onChange={handleChange} required />
          </div>

          <div style={{ gridColumn: "1 / -1" }} className="field">
            <label className="field-label">Descripción</label>
            <textarea
              className="field-textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              style={{ minHeight: 80 }}
            />
          </div>
        </div>

        {/* Botón principal */}
        <button disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
          {loading ? "Registrando..." : "Registrarme como proveedor"}
        </button>

      </form>
    </div>
  )
}
