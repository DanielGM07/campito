// File: src/pages/admin/AdminUsersPage.jsx
import { useEffect, useState, useMemo } from "react";
import { api } from "../../api/http";

const STATUS_LABELS = {
  active: "Activo",
  suspended: "Suspendido",
  deleted: "Eliminado",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("admin_user_list");
      setUsers(res.users ?? []);
    } catch (e) {
      setError(e.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesStatus =
        statusFilter === "all" ? true : u.status === statusFilter;
      const matchesSearch =
        search.trim().length === 0 ||
        `${u.first_name} ${u.last_name}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [users, search, statusFilter]);

  function nextStatus(u) {
    if (u.status === "active") return "suspended";
    if (u.status === "suspended") return "active";
    return null;
  }

  async function handleToggleStatus(u) {
    const newStatus = nextStatus(u);
    if (!newStatus) return;

    if (
      !window.confirm(
        newStatus === "suspended"
          ? `¿Suspender a ${u.first_name}?`
          : `¿Reactivar a ${u.first_name}?`
      )
    )
      return;

    setActionLoadingId(u.id);
    setActionError(null);

    try {
      await api.post("admin_user_change_status", {
        user_id: u.id,
        status: newStatus,
      });
      await loadUsers();
    } catch (e) {
      setActionError(
        e.message || "Error al actualizar el estado del usuario"
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="app-main">
      <div className="app-main-inner">
        <h1 className="page-title">Jugadores</h1>
        <p className="page-subtitle">
          Administrá el estado de todos los jugadores del sistema.
        </p>

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

        {/* Filtros */}
        <div className="card mb-4">
          <div className="card-header" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="card-title">Filtros</div>
              <div className="card-subtitle">Refiná la búsqueda</div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <input
                placeholder="Buscar nombre o email..."
                className="field-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 200 }}
              />

              <select
                className="field-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 120 }}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="suspended">Suspendidos</option>
                <option value="deleted">Eliminados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Listado de jugadores</div>
            <div className="card-subtitle">
              {loading
                ? "Cargando..."
                : `${filteredUsers.length} usuario(s) encontrados`}
            </div>
          </div>

          {loading ? (
            <div className="py-6 text-sm text-slate-500">Cargando usuarios...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-6 text-sm text-slate-500">
              No hay usuarios que coincidan con el filtro.
            </div>
          ) : (
            <div className="requests-table-wrapper">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Fecha registro</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const newStatus = nextStatus(u);
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="font-medium">
                            {u.first_name} {u.last_name}
                          </div>
                        </td>
                        <td>
                          <span className="chip">{u.email}</span>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background:
                                u.status === "active"
                                  ? "rgba(22,163,74,0.1)"
                                  : u.status === "suspended"
                                  ? "rgba(234,88,12,0.1)"
                                  : "rgba(148,163,184,0.1)",
                              borderColor:
                                u.status === "active"
                                  ? "rgba(34,197,94,0.5)"
                                  : u.status === "suspended"
                                  ? "rgba(249,115,22,0.5)"
                                  : "rgba(148,163,184,0.5)",
                              color:
                                u.status === "active"
                                  ? "#16a34a"
                                  : u.status === "suspended"
                                  ? "#ea580c"
                                  : "var(--text-muted)",
                            }}
                          >
                            {STATUS_LABELS[u.status] || u.status}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString()
                            : "-"}
                        </td>

                        <td className="text-right">
                          {newStatus && (
                            <button
                              type="button"
                              className={
                                "btn btn-sm " +
                                (newStatus === "suspended"
                                  ? "btn-danger"
                                  : "btn-primary")
                              }
                              disabled={actionLoadingId === u.id}
                              onClick={() => handleToggleStatus(u)}
                            >
                              {actionLoadingId === u.id
                                ? "Procesando..."
                                : newStatus === "suspended"
                                ? "Suspender"
                                : "Reactivar"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
