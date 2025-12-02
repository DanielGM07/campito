// File: src/pages/admin/AdminProvidersPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/http'

const STATUS_LABELS = {
  active: 'Activo',
  suspended: 'Suspendido',
  deleted: 'Eliminado',
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [actionError, setActionError] = useState(null)

  async function loadProviders() {
    setLoading(true)
    setError(null)
    try {
      // 🔁 Endpoint esperado en el backend:
      // GET admin_provider_list  → { providers: [...] }
      const res = await api.get('admin_provider_list')
      setProviders(res.providers ?? [])
    } catch (e) {
      setError(e.message || 'Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProviders()
  }, [])

  const filteredProviders = useMemo(() => {
    if (statusFilter === 'all') return providers
    return providers.filter((p) => p.status === statusFilter)
  }, [providers, statusFilter])

  function askNextStatus(provider) {
    if (provider.status === 'active') return 'suspended'
    if (provider.status === 'suspended') return 'active'
    return null
  }

  async function handleToggleStatus(provider) {
    const nextStatus = askNextStatus(provider)
    if (!nextStatus) {
      return
    }

    const confirmText =
      nextStatus === 'suspended'
        ? `¿Seguro que querés suspender al proveedor "${provider.venue_name}"?`
        : `¿Reactivar al proveedor "${provider.venue_name}"?`

    if (!window.confirm(confirmText)) return

    setActionLoadingId(provider.id)
    setActionError(null)
    try {
      // 🔁 Endpoint esperado en el backend:
      // POST admin_provider_change_status  → { provider: {...} }
      await api.post('admin_provider_change_status', {
        provider_id: provider.id,
        status: nextStatus,
      })
      await loadProviders()
    } catch (e) {
      setActionError(
        e.message || 'Error al cambiar el estado del proveedor'
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  const total = providers.length
  const totalActive = providers.filter((p) => p.status === 'active').length
  const totalSuspended = providers.filter(
    (p) => p.status === 'suspended'
  ).length

  const hasProviders = !loading && filteredProviders.length > 0

  return (
    <div className="app-main">
      <div className="app-main-inner">
        {/* Encabezado */}
        <div className="mb-4 flex flex-col gap-2">
          <div>
            <h1 className="page-title">Proveedores</h1>
            <p className="page-subtitle">
              Administrá los complejos deportivos registrados en la plataforma.
            </p>
          </div>
        </div>

        {/* Errores */}
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

        {/* Resumen rápido */}
        <div className="grid gap-3 md:grid-cols-3 mb-4">
          <div className="card">
            <div className="card-title">Total proveedores</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
              {total}
            </div>
            <div className="card-subtitle">En cualquier estado</div>
          </div>
          <div className="card">
            <div className="card-title">Activos</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
              {totalActive}
            </div>
            <div className="card-subtitle">
              Pueden recibir reservas normalmente.
            </div>
          </div>
          <div className="card">
            <div className="card-title">Suspendidos</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
              {totalSuspended}
            </div>
            <div className="card-subtitle">
              No visibles o restringidos según reglas del sistema.
            </div>
          </div>
        </div>

        {/* Filtros + tabla */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Listado de proveedores</div>
              <div className="card-subtitle">
                {loading
                  ? 'Cargando...'
                  : hasProviders
                  ? `${filteredProviders.length} proveedor(es) coinciden con el filtro.`
                  : 'No hay proveedores para el filtro seleccionado.'}
              </div>
            </div>

            {/* Filtro por estado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}
              >
                Estado:
              </span>
              <select
                className="field-select"
                style={{ minWidth: 130 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="suspended">Suspendidos</option>
                <option value="deleted">Eliminados</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-6 text-sm text-slate-500">
              Cargando proveedores...
            </div>
          ) : !hasProviders ? (
            <div className="py-6 text-sm text-slate-500">
              No hay proveedores para mostrar.
            </div>
          ) : (
            <div className="requests-table-wrapper">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Complejo</th>
                    <th>Usuario dueño</th>
                    <th>Contacto</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviders.map((p) => {
                    const nextStatus = askNextStatus(p)
                    const canToggle = !!nextStatus

                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="font-medium">{p.venue_name}</div>
                          {p.address && (
                            <div className="text-xs text-slate-500">
                              {p.address}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="font-medium">
                            {p.user_first_name} {p.user_last_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {p.user_email}
                          </div>
                        </td>
                        <td className="text-xs text-slate-600">
                          <div>{p.contact_phone}</div>
                          <div className="text-slate-500">
                            {p.contact_email}
                          </div>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              borderColor:
                                p.status === 'active'
                                  ? 'rgba(34,197,94,0.5)'
                                  : p.status === 'suspended'
                                  ? 'rgba(249,115,22,0.5)'
                                  : 'rgba(148,163,184,0.7)',
                              background:
                                p.status === 'active'
                                  ? 'rgba(22,163,74,0.1)'
                                  : p.status === 'suspended'
                                  ? 'rgba(234,88,12,0.08)'
                                  : 'rgba(148,163,184,0.08)',
                              color:
                                p.status === 'active'
                                  ? '#16a34a'
                                  : p.status === 'suspended'
                                  ? '#ea580c'
                                  : 'var(--text-muted)',
                            }}
                          >
                            {STATUS_LABELS[p.status] || p.status}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500">
                          {p.created_at
                            ? new Date(p.created_at).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="text-right">
                          <div className="inline-flex gap-2">
                            {canToggle && (
                              <button
                                type="button"
                                className={
                                  'btn btn-sm ' +
                                  (nextStatus === 'suspended'
                                    ? 'btn-danger'
                                    : 'btn-primary')
                                }
                                disabled={actionLoadingId === p.id}
                                onClick={() => handleToggleStatus(p)}
                              >
                                {actionLoadingId === p.id
                                  ? 'Procesando...'
                                  : nextStatus === 'suspended'
                                  ? 'Suspender'
                                  : 'Reactivar'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
