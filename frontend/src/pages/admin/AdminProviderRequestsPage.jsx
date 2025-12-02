// File: src/pages/admin/AdminProviderRequestsPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/http'

export default function AdminProviderRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [actionError, setActionError] = useState(null)

  // estado del modal
  const [modal, setModal] = useState({
    type: null, // 'approve' | 'reject' | null
    request: null,
    comment: '',
  })

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

  function openApproveModal(req) {
    setModal({
      type: 'approve',
      request: req,
      comment: '',
    })
    setActionError(null)
  }

  function openRejectModal(req) {
    setModal({
      type: 'reject',
      request: req,
      comment: '',
    })
    setActionError(null)
  }

  function closeModal() {
    if (actionLoadingId) return // no cierro mientras procesa
    setModal({
      type: null,
      request: null,
      comment: '',
    })
  }

  async function handleConfirmModal() {
    if (!modal.request) return

    const id = modal.request.id
    setActionLoadingId(id)
    setActionError(null)

    try {
      if (modal.type === 'approve') {
        await api.post('provider_request_approve', { request_id: id })
      } else if (modal.type === 'reject') {
        await api.post('provider_request_reject', {
          request_id: id,
          comment: modal.comment || null,
        })
      }

      await loadRequests()
      closeModal()
    } catch (e) {
      setActionError(
        e.message ||
          (modal.type === 'approve'
            ? 'Error al aprobar la solicitud'
            : 'Error al rechazar la solicitud')
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  const hasRequests = !loading && requests.length > 0

  return (
    <div className="app-main">
      <div className="app-main-inner">
        <div className="mb-4">
          <h1 className="page-title">Solicitudes de proveedores</h1>
          <p className="page-subtitle">
            Revisá y gestioná las solicitudes pendientes de usuarios que quieren
            convertirse en proveedores de canchas.
          </p>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {actionError && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {actionError}
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Solicitudes pendientes</div>
              <div className="card-subtitle">
                {loading
                  ? 'Cargando...'
                  : hasRequests
                  ? `${requests.length} solicitud(es) pendiente(s).`
                  : 'No hay solicitudes pendientes en este momento.'}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-6 text-sm text-slate-500">
              Cargando solicitudes...
            </div>
          ) : !hasRequests ? (
            <div className="py-6 text-sm text-slate-500">
              No hay solicitudes pendientes en este momento.
            </div>
          ) : (
            <div className="requests-table-wrapper">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Nombre del complejo</th>
                    <th>Contacto</th>
                    <th>Dirección</th>
                    <th>Descripción</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <span className="chip">
                          {req.created_at
                            ? new Date(req.created_at).toLocaleString()
                            : '-'}
                        </span>
                      </td>
                      <td>
                        <div className="font-medium">
                          {req.first_name} {req.last_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID usuario: {req.user_id}
                        </div>
                      </td>
                      <td>
                        <span className="chip">{req.email}</span>
                      </td>
                      <td>
                        <div className="font-medium">{req.venue_name}</div>
                      </td>
                      <td className="text-xs text-slate-600">
                        <div>{req.contact_phone}</div>
                        <div className="text-slate-500">
                          {req.contact_email}
                        </div>
                      </td>
                      <td className="text-sm text-slate-700">
                        {req.address}
                      </td>
                      <td className="text-xs text-slate-600">
                        <div className="description-clamp">
                          {req.description}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            disabled={actionLoadingId === req.id}
                            onClick={() => openApproveModal(req)}
                            className="btn btn-sm btn-primary"
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === req.id}
                            onClick={() => openRejectModal(req)}
                            className="btn btn-sm btn-danger"
                          >
                            Rechazar
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
      </div>

      {/* MODAL */}
      {modal.type && modal.request && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">
                  {modal.type === 'approve'
                    ? 'Aprobar solicitud'
                    : 'Rechazar solicitud'}
                </div>
                <div className="modal-subtitle">
                  {modal.type === 'approve'
                    ? 'El usuario pasará a ser proveedor activo del sistema.'
                    : 'Podés indicar un motivo para el rechazo (opcional).'}
                </div>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-summary">
                <div className="modal-summary-main">
                  <div className="modal-summary-title">
                    {modal.request.venue_name}
                  </div>
                  <div className="modal-summary-subtitle">
                    {modal.request.first_name} {modal.request.last_name} ·{' '}
                    {modal.request.email}
                  </div>
                </div>
                {modal.request.address && (
                  <div className="modal-summary-address">
                    {modal.request.address}
                  </div>
                )}
              </div>

              {modal.type === 'reject' && (
                <div className="form-grid" style={{ marginTop: 12 }}>
                  <div className="field">
                    <label className="field-label">
                      Motivo del rechazo (opcional)
                    </label>
                    <textarea
                      className="field-textarea"
                      placeholder="Ej: La información del complejo no es suficiente..."
                      value={modal.comment}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={closeModal}
                disabled={!!actionLoadingId}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={
                  'btn btn-sm ' +
                  (modal.type === 'approve' ? 'btn-primary' : 'btn-danger')
                }
                onClick={handleConfirmModal}
                disabled={!!actionLoadingId}
              >
                {actionLoadingId
                  ? 'Procesando...'
                  : modal.type === 'approve'
                  ? 'Confirmar aprobación'
                  : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
