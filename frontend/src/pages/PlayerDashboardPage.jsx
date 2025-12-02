// File: frontend/src/pages/PlayerDashboardPage.jsx

import { useEffect, useState } from 'react'
import { api } from '../api/http'
import { useAuth } from '../context/AuthContext'

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
  if (error) return <p className="text-red-400 text-sm">{error}</p>

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-semibold mb-1">
          Hola, {user?.first_name} 👋
        </h1>
        <p className="text-xs text-slate-400">
          Panel rápido con tus reservas y puntos.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Mis reservas</h2>
          {reservations.length === 0 ? (
            <p className="text-xs text-slate-500">Todavía no tenés reservas.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {reservations.slice(0, 5).map((r) => (
                <li
                  key={r.id}
                  className="flex justify-between items-center bg-slate-950/60 border border-slate-800 rounded-md px-3 py-2"
                >
                  <div>
                    <div className="font-medium">
                      {r.reserved_date} {r.start_time.slice(0, 5)} -{' '}
                      {r.end_time.slice(0, 5)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Tipo: {r.type} · Estado: {r.status}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-300">
                      ${Number(r.total_price).toLocaleString('es-AR')}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      x {r.players_count} jugadores
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Mis puntos</h2>
          {wallet ? (
            <>
              <div className="flex gap-4 mb-3 text-sm">
                <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-md px-3 py-2">
                  <div className="text-[11px] text-slate-400">Puntos</div>
                  <div className="text-lg font-semibold">
                    {wallet.points_balance}
                  </div>
                </div>
                <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-md px-3 py-2">
                  <div className="text-[11px] text-slate-400">Estrellas</div>
                  <div className="text-lg font-semibold">
                    {wallet.stars_balance}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mb-2">
                Movimientos recientes
              </div>
              {walletTx.length === 0 ? (
                <p className="text-xs text-slate-500">Sin movimientos.</p>
              ) : (
                <ul className="space-y-1 text-[11px]">
                  {walletTx.slice(0, 5).map((tx) => (
                    <li
                      key={tx.id}
                      className="flex justify-between bg-slate-950/60 border border-slate-800 rounded-md px-3 py-1.5"
                    >
                      <div>
                        <div>{tx.description || tx.type}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(tx.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div
                        className={
                          tx.amount >= 0
                            ? 'text-emerald-400 font-medium'
                            : 'text-red-400 font-medium'
                        }
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">No se encontró la wallet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
