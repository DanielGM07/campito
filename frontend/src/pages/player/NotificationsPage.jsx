// File: src/pages/player/NotificationsPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [markingId, setMarkingId] = useState(null)

  const loadNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('notification_list_my')
      setNotifications(res.notifications || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkRead = async (id) => {
    setMarkingId(id)
    try {
      await api.post('notification_mark_read', { id })
      await loadNotifications()
    } catch (e) {
      console.error(e)
    } finally {
      setMarkingId(null)
    }
  }

  const unread = notifications.filter((n) => !n.is_read)
  const read = notifications.filter((n) => n.is_read)

  return (
    <div>
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">Notificaciones</h1>
        <p className="page-subtitle">
          Enterate de cambios en tus reservas, invitaciones a equipos, torneos y
          más.
        </p>
      </section>

      {error && (
        <p style={{ fontSize: 13, color: '#f97373', marginBottom: 8 }}>
          Error al cargar notificaciones: {error}
        </p>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 14,
        }}
      >
        {/* No leídas */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">No leídas</div>
              <div className="card-subtitle">
                Notificaciones nuevas o pendientes de revisar.
              </div>
            </div>
            <div className="chip">
              {unread.length} sin leer
            </div>
          </div>

          {loading ? (
            <p className="page-subtitle">Cargando...</p>
          ) : unread.length === 0 ? (
            <p className="page-subtitle">
              No tenés notificaciones pendientes. Todo al día ✅
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginTop: 6,
              }}
            >
              {unread.map((n) => (
                <div
                  key={n.id}
                  style={{
                    borderRadius: 12,
                    border: '1px solid rgba(56,189,248,0.8)',
                    padding: '8px 10px',
                    fontSize: 12,
                    background:
                      'radial-gradient(circle at top left, rgba(0,229,255,0.22), transparent 60%), #020617',
                    color: '#e5e7eb',
                    boxShadow: '0 16px 36px rgba(15,23,42,0.9)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>
                      {n.type?.toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 600 }}>{n.title}</div>
                    {n.message && (
                      <p
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          opacity: 0.95,
                        }}
                      >
                        {n.message}
                      </p>
                    )}
                    <div
                      style={{
                        fontSize: 10,
                        opacity: 0.8,
                        marginTop: 4,
                      }}
                    >
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleMarkRead(n.id)}
                      disabled={markingId === n.id}
                    >
                      {markingId === n.id
                        ? 'Marcando...'
                        : 'Marcar como leída'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historial leídas */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Historial</div>
              <div className="card-subtitle">
                Notificaciones que ya marcaste como leídas.
              </div>
            </div>
          </div>

          {loading ? (
            <p className="page-subtitle">Cargando historial...</p>
          ) : read.length === 0 ? (
            <p className="page-subtitle">
              Todavía no tenés historial de notificaciones.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginTop: 6,
                maxHeight: 260,
                overflow: 'auto',
              }}
            >
              {read.map((n) => (
                <div
                  key={n.id}
                  style={{
                    borderRadius: 10,
                    border: '1px solid rgba(148,163,184,0.5)',
                    padding: '7px 9px',
                    fontSize: 11,
                    background:
                      'linear-gradient(135deg, rgba(15,23,42,0.08), transparent)',
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {n.type?.toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 500 }}>{n.title}</div>
                  {n.message && (
                    <p
                      style={{
                        marginTop: 3,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {n.message}
                    </p>
                  )}
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 10,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
