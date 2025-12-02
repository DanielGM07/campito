// File: src/pages/player/PlayerDashboardPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'
import { useAuth } from '../../context/AuthContext'

export default function PlayerDashboardPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [wallet, setWallet] = useState(null)
  const [walletTx, setWalletTx] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function fetchData() {
      try {
        const [resRes, resWallet] = await Promise.all([
          api.get('reservation_list_my'),
          api.get('wallet_get_my'),
        ])
        if (!isMounted) return
        setReservations(resRes.reservations || [])
        setWallet(resWallet.wallet)
        setWalletTx(resWallet.transactions || [])
      } catch (e) {
        if (!isMounted) return
        setError(e.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchData()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) return <p>Cargando...</p>
  if (error)
    return <p style={{ fontSize: 13, color: '#f97373' }}>Error: {error}</p>

  return (
    <div className="page">
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">
          Hola, {user?.first_name} 👋
        </h1>
        <p className="page-subtitle">
          Resumen rápido de tus últimas reservas y puntos acumulados.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 14,
        }}
      >
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Mis últimas reservas</div>
              <div className="card-subtitle">
                Se muestran solo las más recientes.
              </div>
            </div>
            <div className="chip">Hasta 5 últimas</div>
          </div>

          {reservations.length === 0 ? (
            <p className="page-subtitle">Todavía no reservaste ninguna cancha.</p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginTop: 6,
              }}
            >
              {reservations.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  style={{
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.5)',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    background:
                      'linear-gradient(135deg, rgba(15,23,42,0.12), transparent)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>
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
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>
                      $
                      {Number(r.total_price).toLocaleString('es-AR')}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      ${Number(r.price_per_player).toLocaleString('es-AR')} c/u
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Mi wallet</div>
              <div className="card-subtitle">
                Puntos y estrellas que vas ganando en Campito.
              </div>
            </div>
          </div>

          {wallet ? (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    padding: '10px 11px',
                    background:
                      'radial-gradient(circle at top left, rgba(0,229,255,0.35), transparent 60%), #020617',
                    color: '#e5e7eb',
                    boxShadow: '0 16px 40px rgba(15,23,42,0.9)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.8,
                      marginBottom: 2,
                    }}
                  >
                    Puntos
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {wallet.points_balance}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    padding: '10px 11px',
                    background:
                      'linear-gradient(135deg, rgba(250,250,250,0.08), transparent)',
                    border: '1px solid rgba(148,163,184,0.6)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginBottom: 2,
                    }}
                  >
                    Estrellas
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {wallet.stars_balance}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginBottom: 4,
                }}
              >
                Movimientos recientes
              </div>

              {walletTx.length === 0 ? (
                <p className="page-subtitle">Todavía no tenés movimientos.</p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  {walletTx.slice(0, 6).map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        borderRadius: 10,
                        border: '1px solid rgba(148,163,184,0.4)',
                        padding: '6px 8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        background:
                          'linear-gradient(135deg, rgba(15,23,42,0.08), transparent)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {tx.description || tx.type}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            marginTop: 1,
                          }}
                        >
                          {new Date(tx.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          color:
                            tx.amount >= 0
                              ? '#22c55e'
                              : '#f97373',
                        }}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="page-subtitle">No se encontró la wallet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
