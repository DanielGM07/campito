// File: src/pages/player/ReservationsPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [cancelLoadingId, setCancelLoadingId] = useState(null)

  const [reviewReservationId, setReviewReservationId] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(null)

  const loadReservations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('reservation_list_my')
      setReservations(res.reservations || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReservations()
  }, [])

  const handleCancel = async (reservationId) => {
    setCancelLoadingId(reservationId)
    setActionError(null)
    try {
      await api.post('reservation_cancel_my', { id: reservationId })
      await loadReservations()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setCancelLoadingId(null)
    }
  }

  const openReviewForm = (reservationId) => {
    setReviewReservationId(reservationId)
    setReviewRating(5)
    setReviewComment('')
    setReviewSuccess(null)
    setActionError(null)
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!reviewReservationId) return
    setReviewLoading(true)
    setReviewSuccess(null)
    setActionError(null)
    try {
      await api.post('review_create', {
        reservation_id: reviewReservationId,
        rating: reviewRating,
        comment: reviewComment || undefined,
      })
      setReviewSuccess('Reseña enviada correctamente.')
      await loadReservations()
    } catch (e2) {
      setActionError(e2.message)
    } finally {
      setReviewLoading(false)
    }
  }

  const now = new Date()
  const toDate = (r) =>
    new Date(`${r.reserved_date}T${r.start_time || '00:00:00'}`)

  const upcoming = reservations.filter((r) => toDate(r) >= now)
  const past = reservations.filter((r) => toDate(r) < now)

  return (
    <div>
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">Mis reservas</h1>
        <p className="page-subtitle">
          Gestioná tus reservas futuras y calificá las que ya jugaste.
        </p>
      </section>

      {(error || actionError || reviewSuccess) && (
        <div style={{ marginBottom: 10 }}>
          {error && (
            <p style={{ fontSize: 13, color: '#f97373' }}>
              Error al cargar reservas: {error}
            </p>
          )}
          {actionError && (
            <p style={{ fontSize: 12, color: '#f97373' }}>
              {actionError}
            </p>
          )}
          {reviewSuccess && (
            <p style={{ fontSize: 12, color: '#4ade80' }}>
              {reviewSuccess}
            </p>
          )}
        </div>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 14,
        }}
      >
        {/* Próximas reservas */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Próximas reservas</div>
              <div className="card-subtitle">
                Podés cancelar aquellas que sigan activas.
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" disabled>
              Próximamente: reservar cancha
            </button>
          </div>

          {loading ? (
            <p className="page-subtitle">Cargando reservas...</p>
          ) : upcoming.length === 0 ? (
            <p className="page-subtitle">
              No tenés reservas futuras por el momento.
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
              {upcoming.map((r) => (
                <div
                  key={r.id}
                  style={{
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.5)',
                    padding: '8px 10px',
                    fontSize: 12,
                    background:
                      'linear-gradient(135deg, rgba(15,23,42,0.12), transparent)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {r.reserved_date} · {r.start_time.slice(0, 5)} -{' '}
                      {r.end_time.slice(0, 5)}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      Tipo: {r.type} · Estado: {r.status} ·{' '}
                      {r.players_count} jugadores
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      Total: $
                      {Number(r.total_price).toLocaleString('es-AR')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {r.status === 'confirmed' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleCancel(r.id)}
                        disabled={cancelLoadingId === r.id}
                      >
                        {cancelLoadingId === r.id
                          ? 'Cancelando...'
                          : 'Cancelar'}
                      </button>
                    )}
                    {r.status !== 'confirmed' && (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        No cancelable
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historial + calificación */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Historial de reservas</div>
              <div className="card-subtitle">
                Turnos completados y posibilidad de dejarnos una reseña.
              </div>
            </div>
          </div>

          {loading ? (
            <p className="page-subtitle">Cargando historial...</p>
          ) : past.length === 0 ? (
            <p className="page-subtitle">
              Todavía no tenés reservas en el historial.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginTop: 6,
                  maxHeight: 220,
                  overflow: 'auto',
                }}
              >
                {past.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      borderRadius: 12,
                      border: '1px solid rgba(148,163,184,0.35)',
                      padding: '7px 9px',
                      fontSize: 11,
                      background:
                        'linear-gradient(135deg, rgba(15,23,42,0.08), transparent)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {r.reserved_date} · {r.start_time.slice(0, 5)}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginTop: 2,
                        }}
                      >
                        Estado: {r.status} · Tipo: {r.type}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600 }}>
                        $
                        {Number(r.total_price).toLocaleString('es-AR')}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {r.players_count} jugadores
                      </div>
                      {r.status === 'completed' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ marginTop: 4 }}
                          onClick={() => openReviewForm(r.id)}
                        >
                          Calificar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulario de reseña */}
              {reviewReservationId && (
                <form
                  onSubmit={submitReview}
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: '1px solid rgba(148,163,184,0.45)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Calificar reserva #{reviewReservationId}
                  </div>
                  <div className="field">
                    <label className="field-label">
                      Rating (1 a 5)
                    </label>
                    <select
                      className="field-select"
                      value={reviewRating}
                      onChange={(e) =>
                        setReviewRating(Number(e.target.value))
                      }
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">
                      Comentario (opcional)
                    </label>
                    <textarea
                      className="field-textarea"
                      rows={3}
                      value={reviewComment}
                      onChange={(e) =>
                        setReviewComment(e.target.value)
                      }
                      placeholder="¿Cómo estuvo la cancha, la atención, etc.?"
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setReviewReservationId(null)}
                      disabled={reviewLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={reviewLoading}
                    >
                      {reviewLoading
                        ? 'Enviando reseña...'
                        : 'Enviar reseña'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
