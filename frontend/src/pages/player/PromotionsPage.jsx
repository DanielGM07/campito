// File: src/pages/player/PromotionsPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([])
  const [wallet, setWallet] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [redeemLoadingId, setRedeemLoadingId] = useState(null)
  const [redeemError, setRedeemError] = useState(null)
  const [redeemSuccess, setRedeemSuccess] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [promosRes, walletRes] = await Promise.all([
        api.get('promotion_list_available'),
        api.get('wallet_get_my'),
      ])
      setPromotions(promosRes.promotions || [])
      setWallet(walletRes.wallet || null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRedeem = async (promotion) => {
    setRedeemLoadingId(promotion.id)
    setRedeemError(null)
    setRedeemSuccess(null)
    try {
      // usamos min_points como puntos a gastar
      const pointsSpent = Number(promotion.min_points || 0) || 0
      await api.post('promotion_redeem', {
        promotion_id: promotion.id,
        points_spent: pointsSpent,
        discount_applied: 0,
      })
      setRedeemSuccess('Promoción canjeada correctamente.')
      await loadData()
    } catch (e) {
      setRedeemError(e.message)
    } finally {
      setRedeemLoadingId(null)
    }
  }

  return (
    <div>
      <section style={{ marginBottom: 14 }}>
        <h1 className="page-title">Promociones</h1>
        <p className="page-subtitle">
          Canjeá tus puntos por beneficios y descuentos en Campito.
        </p>
      </section>

      {(error || redeemError || redeemSuccess) && (
        <div style={{ marginBottom: 10 }}>
          {error && (
            <p style={{ fontSize: 13, color: '#f97373' }}>
              Error al cargar promociones: {error}
            </p>
          )}
          {redeemError && (
            <p style={{ fontSize: 12, color: '#f97373' }}>
              {redeemError}
            </p>
          )}
          {redeemSuccess && (
            <p style={{ fontSize: 12, color: '#4ade80' }}>
              {redeemSuccess}
            </p>
          )}
        </div>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
          gap: 14,
        }}
      >
        {/* Resumen de puntos */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Mi saldo de puntos</div>
              <div className="card-subtitle">
                Puntos disponibles para canjear.
              </div>
            </div>
          </div>

          {wallet ? (
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 4,
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
                  Puntos disponibles
                </div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
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
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {wallet.stars_balance}
                </div>
              </div>
            </div>
          ) : (
            <p className="page-subtitle">No se pudo obtener tu wallet.</p>
          )}
        </div>

        {/* Listado de promociones */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Promos disponibles</div>
              <div className="card-subtitle">
                Se muestran solo las promos vigentes hoy.
              </div>
            </div>
          </div>

          {loading ? (
            <p className="page-subtitle">Cargando promociones...</p>
          ) : promotions.length === 0 ? (
            <p className="page-subtitle">
              No hay promociones activas en este momento.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 10,
                marginTop: 6,
              }}
            >
              {promotions.map((p) => (
                <div
                  key={p.id}
                  style={{
                    borderRadius: 14,
                    border: '1px solid rgba(148,163,184,0.5)',
                    padding: '9px 10px',
                    fontSize: 12,
                    background:
                      'linear-gradient(135deg, rgba(15,23,42,0.08), transparent)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  {p.description && (
                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {p.description}
                    </p>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}
                  >
                    Vigencia: {p.valid_from} → {p.valid_to}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}
                  >
                    Mínimo de puntos: {p.min_points}
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 4 }}
                    onClick={() => handleRedeem(p)}
                    disabled={
                      !p.can_redeem ||
                      redeemLoadingId === p.id ||
                      !wallet ||
                      wallet.points_balance < p.min_points
                    }
                  >
                    {redeemLoadingId === p.id
                      ? 'Canjeando...'
                      : p.can_redeem
                      ? 'Canjear promoción'
                      : 'No alcanzás el mínimo'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
