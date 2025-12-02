// File: src/pages/admin/AdminTournamentsPage.jsx
import { useState, useEffect, useMemo } from "react";
import { api } from "../../api/http";

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");

  useEffect(() => {
    loadTournaments();
  }, []);

  async function loadTournaments() {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("admin_tournament_list");
      setTournaments(res.tournaments ?? []);
    } catch (e) {
      setError("Error al cargar torneos");
    } finally {
      setLoading(false);
    }
  }

  const providerList = useMemo(() => {
    const map = {};
    const out = [];
    for (let t of tournaments) {
      if (!map[t.provider_id]) {
        map[t.provider_id] = true;
        out.push({
          id: t.provider_id,
          name: t.provider_name,
        });
      }
    }
    return out;
  }, [tournaments]);

  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      const matchSearch =
        search.trim() === "" ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.provider_name.toLowerCase().includes(search.toLowerCase());

      const matchState =
        stateFilter === "all" || t.status === stateFilter;

      const matchSport =
        sportFilter === "all" || t.sport === sportFilter;

      const matchProvider =
        providerFilter === "all" ||
        t.provider_id.toString() === providerFilter;

      return matchSearch && matchState && matchSport && matchProvider;
    });
  }, [tournaments, search, stateFilter, sportFilter, providerFilter]);

  return (
    <div className="app-main">
      <div className="app-main-inner">
        <h1 className="page-title">Torneos</h1>
        <p className="page-subtitle">
          Supervisá todos los torneos creados en el sistema.
        </p>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* FILTROS */}
        <div className="card mb-4">
          <div className="card-header" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="card-title">Filtros</div>
              <div className="card-subtitle">Buscá por nombre, estado o proveedor</div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>

              <input
                className="field-input"
                placeholder="Buscar torneo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 170 }}
              />

              <select
                className="field-select"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                style={{ width: 130 }}
              >
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="active">Activo</option>
                <option value="finished">Finalizado</option>
                <option value="cancelled">Cancelado</option>
              </select>

              <select
                className="field-select"
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                style={{ width: 130 }}
              >
                <option value="all">Todos los deportes</option>
                <option value="futbol">Fútbol</option>
                <option value="padel">Pádel</option>
                <option value="tenis">Tenis</option>
                <option value="basket">Basket</option>
              </select>

              <select
                className="field-select"
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                style={{ width: 170 }}
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

        {/* TABLA */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Listado de torneos</div>
              <div className="card-subtitle">
                {loading
                  ? "Cargando..."
                  : `${filtered.length} torneo(s) encontrados`}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-6 text-sm text-slate-500">Cargando torneos...</div>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-sm text-slate-500">
              No hay torneos que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="requests-table-wrapper">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Deporte</th>
                    <th>Proveedor</th>
                    <th>Equipos</th>
                    <th>Estado</th>
                    <th>Fechas</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium">{t.name}</td>

                      <td>
                        <span className="chip">{t.sport}</span>
                      </td>

                      <td>
                        <div className="font-medium">{t.provider_name}</div>
                      </td>

                      <td>
                        <span className="badge">{t.team_count ?? 0} equipos</span>
                      </td>

                      <td>
                        <span className="badge">{t.status}</span>
                      </td>

                      <td className="text-xs text-slate-500">
                        {t.start_date} → {t.end_date}
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
