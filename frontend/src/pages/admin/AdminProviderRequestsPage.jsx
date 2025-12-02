// File: src/pages/admin/AdminProviderRequestsPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function AdminProviderRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [actionError, setActionError] = useState(null)

  async function loadRequests() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('provider_request_list_pending')
      setRequests(res.requests ?? [])
    } catch (e) {
      setError(e.message || 'Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  async function handleApprove(id) {
    if (!window.confirm('¿Seguro que querés aprobar esta solicitud?')) return

    setActionLoadingId(id)
    setActionError(null)
    try {
      await api.post('provider_request_approve', { request_id: id })
      await loadRequests()
    } catch (e) {
      setActionError(e.message || 'Error al aprobar la solicitud')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleReject(id) {
    const comment = window.prompt(
      'Motivo (opcional) del rechazo:',
      ''
    )

    if (comment === null) return // cancelado

    setActionLoadingId(id)
    setActionError(null)
    try {
      await api.post('provider_request_reject', {
        request_id: id,
        comment: comment || null,
      })
      await loadRequests()
    } catch (e) {
      setActionError(e.message || 'Error al rechazar la solicitud')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-2">
        Solicitudes de proveedores
      </h1>
      <p className="text-slate-600 mb-4">
        Revisá las solicitudes pendientes de usuarios que quieren convertirse en
        proveedores de canchas.
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {actionError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Cargando solicitudes...</div>
      ) : requests.length === 0 ? (
        <div className="text-sm text-slate-500">
          No hay solicitudes pendientes en este momento.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Fecha
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Usuario
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Email
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Nombre del complejo
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Contacto
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Dirección
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Descripción
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-3 py-2 align-top text-xs text-slate-500">
                    {req.created_at
                      ? new Date(req.created_at).toLocaleString()
                      : '-'}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="font-medium text-slate-800">
                      {req.first_name} {req.last_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      ID usuario: {req.user_id}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-slate-600">
                    {req.email}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="font-medium text-slate-800">
                      {req.venue_name}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-slate-600">
                    <div>{req.contact_phone}</div>
                    <div className="text-slate-500">{req.contact_email}</div>
                  </td>
                  <td className="px-3 py-2 align-top text-sm text-slate-700">
                    {req.address}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-slate-600 max-w-xs">
                    <div className="line-clamp-3">{req.description}</div>
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        disabled={actionLoadingId === req.id}
                        onClick={() => handleApprove(req.id)}
                        className="px-3 py-1 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {actionLoadingId === req.id
                          ? 'Procesando...'
                          : 'Aprobar'}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoadingId === req.id}
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoadingId === req.id
                          ? 'Procesando...'
                          : 'Rechazar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
