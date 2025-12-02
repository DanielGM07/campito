// File: src/pages/admin/AdminReservationsPage.jsx
import { useState, useEffect, useMemo } from "react";
import { api } from "../../api/http";

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  async function loadReservations() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("admin_reservation_list");
      setReservations(res.reservations ?? []);
    } catch (e) {
      setError(e.message || "Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReservations();
  }, []);

  // obtener lista única de proveedores
  const providerList = useMemo(() => {
    const arr = reservations.map((r) => ({
      id: r.provider_id,
      name: r.provider_name,
    }));
    const unique = [];
    const map = {};
    for (let p of arr) {
      if (!map[p.id]) {
        map[p.id] = true;
        unique.push(p);
      }
    }
    return unique;
  }, [reservations]);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      const matchSearch =
        search.trim() === "" ||
        r.player_name.toLowerCase().includes(search.toLowerCase()) ||
        r.player_email.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all" || r.status === statusFilter;

      const matchProvider =
        providerFilter === "all" ||
        r.provider_id.toString() === providerFilter;

      const matchDate =
        dateFilter === "" ||
        r.date.startsWith(dateFilter); // yyyy-mm-dd

      return matchSearch && matchStatus && matchProvider && matchDate;
    });
  }, [reservations, search, statusFilter, providerFilter, dateFilter]);

  return (
    <div className="app-main">
      <div className="app-main-inner">
        <h1 className="page-title">Reservas del sistema</h1>
        <p className="page-subtitle">
          Supervisá todas las reservas realizadas en la plataforma.
        </p>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="card mb-4">
          <div className="card-header" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="card-title">Filtros</div>
              <div className="card-subtitle">
                Buscá por fecha, jugador, estado o proveedor.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="field-input"
                placeholder="Buscar jugador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 180 }}
              />

              <input
                type="date"
                className="field-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ width: 150 }}
              />

              <select
                className="field-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 140 }}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="cancelled">Cancelada</option>
                <option value="completed">Finalizada</option>
              </select>

              <select
                className="field-select"
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                style={{ width: 140 }}
              >
                <option value="all">Todos los proveedores</option>
                {providerList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Reservas</div>
              <div className="card-subtitle">
                {loading
                  ? "Cargando..."
                  : `${filtered.length} reserva(s) encontradas`}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-6 text-sm text-slate-500">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-sm text-slate-500">
              No hay reservas con esos filtros.
            </div>
          ) : (
            <div className="requests-table-wrapper">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Jugador</th>
                    <th>Proveedor</th>
                    <th>Cancha</th>
                    <th>Horario</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td className="text-xs text-slate-500">{r.date}</td>
                      <td>
                        <div className="font-medium">{r.player_name}</div>
                        <div className="text-xs text-slate-500">
                          {r.player_email}
                        </div>
                      </td>

                      <td>
                        <div className="font-medium">{r.provider_name}</div>
                      </td>

                      <td>
                        <span className="chip">{r.court_name}</span>
                      </td>

                      <td>
                        <span className="chip">
                          {r.start_time} - {r.end_time}
                        </span>
                      </td>

                      <td>
                        <span className="badge">{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
