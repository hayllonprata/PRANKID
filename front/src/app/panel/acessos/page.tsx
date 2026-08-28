"use client";

import { useEffect, useState } from "react";
import { AccessPieChart } from "@/components/panel/AccessPieChart";
import { ConfirmModal } from "@/components/panel/ConfirmModal";
import { api } from "@/lib/api";

type SiteAccess = {
  id: string;
  ip: string;
  visitCount: number;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string;
  locationSource: string;
  userAgent: string;
  blocked: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
};

type ChartSlice = { label: string; count: number };

type AccessReport = {
  uniqueIps: number;
  totalVisits: number;
  blockedCount: number;
  gpsCount: number;
  matched: number;
  page: number;
  pageSize: number;
  pageCount: number;
  byState: ChartSlice[];
  byCountry: ChartSlice[];
  accesses: SiteAccess[];
};

function formatWhen(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function formatCoords(access: SiteAccess) {
  if (access.latitude == null || access.longitude == null) return "";
  return `${access.latitude.toFixed(6)}, ${access.longitude.toFixed(6)}`;
}

function formatAccuracy(access: SiteAccess) {
  if (access.locationSource !== "gps" || access.accuracy == null) return "";
  const meters = Math.round(access.accuracy);
  if (meters >= 1000) return `± ${(meters / 1000).toFixed(1)} km`;
  return `± ${meters} m`;
}

function formatLocation(access: SiteAccess) {
  if (access.address) return access.address;
  const parts = [access.city, access.region, access.country].filter(Boolean);
  if (parts.length) {
    return access.countryCode ? `${parts.join(" · ")} (${access.countryCode})` : parts.join(" · ");
  }
  return "Localização não identificada";
}

function mapsUrl(access: SiteAccess) {
  if (access.latitude == null || access.longitude == null) return "";
  return `https://www.google.com/maps?q=${access.latitude},${access.longitude}&z=18`;
}

function LocationBlock({ access }: { access: SiteAccess }) {
  const map = mapsUrl(access);
  const coords = formatCoords(access);
  const accuracy = formatAccuracy(access);
  const gps = access.locationSource === "gps";
  return (
    <div className="access-location">
      <div className="access-location-head">
        <span className={`badge ${gps ? "success" : "muted"}`}>{gps ? "GPS" : "IP"}</span>
        {accuracy ? <span className="muted">{accuracy}</span> : null}
      </div>
      <div>{formatLocation(access)}</div>
      {coords ? <code className="access-coords">{coords}</code> : null}
      {map ? (
        <a href={map} target="_blank" rel="noreferrer">
          abrir mapa
        </a>
      ) : null}
    </div>
  );
}

export default function AccessesPage() {
  const [report, setReport] = useState<AccessReport | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [pending, setPending] = useState<SiteAccess | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function load(nextPage = page, nextQuery = debounced) {
    try {
      const params = new URLSearchParams({ page: String(nextPage) });
      if (nextQuery) params.set("q", nextQuery);
      const data = await api<AccessReport>(`/api/admin/accesses?${params.toString()}`);
      if (data.accesses.length === 0 && data.page > 1 && data.matched > 0) {
        setPage(data.page - 1);
        return;
      }
      setReport(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar acessos");
    }
  }

  useEffect(() => {
    load(page, debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debounced]);

  async function toggleBlock(access: SiteAccess) {
    setBusyId(access.id);
    try {
      await api(`/api/admin/accesses/${access.id}`, {
        method: "PUT",
        body: JSON.stringify({ blocked: !access.blocked }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar");
    } finally {
      setBusyId("");
    }
  }

  async function confirmRemove() {
    if (!pending) return;
    setBusyId(pending.id);
    try {
      await api(`/api/admin/accesses/${pending.id}`, { method: "DELETE" });
      setPending(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir");
    } finally {
      setBusyId("");
    }
  }

  const emptyLabel = debounced ? "Nenhum acesso nesta localização." : "Nenhum acesso registrado ainda.";
  const pageCount = report?.pageCount ?? 1;
  const currentPage = report?.page ?? page;

  return (
    <>
      <h1>Acessos</h1>
      <p className="muted">
        Cada IP entra uma vez nesta lista. A quantidade de acessos sobe quando o mesmo IP volta depois de 30 minutos. A
        loja pede a localização no navegador; se a pessoa permitir, o painel mostra o ponto GPS (rua e coordenadas). Se
        recusar, fica a localização aproximada do IP.
      </p>
      {error ? <p className="msg err">{error}</p> : null}

      <div className="access-stats">
        <article className="panel-card">
          <p className="muted">Visitantes únicos (IPs)</p>
          <strong>{report ? report.uniqueIps : "…"}</strong>
        </article>
        <article className="panel-card">
          <p className="muted">Acessos no total</p>
          <strong>{report ? report.totalVisits : "…"}</strong>
        </article>
        <article className="panel-card">
          <p className="muted">Com GPS</p>
          <strong>{report ? report.gpsCount ?? 0 : "…"}</strong>
        </article>
        <article className="panel-card">
          <p className="muted">IPs bloqueados</p>
          <strong>{report ? report.blockedCount : "…"}</strong>
        </article>
      </div>

      <div className="access-charts">
        <AccessPieChart
          title="Por estado (Brasil)"
          slices={report?.byState || []}
          empty="Nenhum acesso no Brasil ainda."
        />
        <AccessPieChart
          title="Por país (fora do Brasil)"
          slices={report?.byCountry || []}
          empty="Nenhum acesso fora do Brasil ainda."
        />
      </div>

      <div className="access-toolbar panel-card">
        <label>
          Pesquisar localização
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cidade, estado, país ou endereço"
          />
        </label>
        <p className="muted">
          {report
            ? `${report.matched} registro${report.matched === 1 ? "" : "s"}${debounced ? " nesta busca" : ""} · página ${currentPage} de ${pageCount}`
            : "Carregando..."}
        </p>
      </div>

      <div className="panel-card access-table-desktop">
        <table className="table">
          <thead>
            <tr>
              <th>IP</th>
              <th>Localização</th>
              <th>Acessos</th>
              <th>Primeiro</th>
              <th>Último</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(report?.accesses || []).map((access) => (
              <tr key={access.id}>
                <td>
                  <code>{access.ip}</code>
                </td>
                <td>
                  <LocationBlock access={access} />
                </td>
                <td>{access.visitCount}</td>
                <td>{formatWhen(access.firstSeenAt)}</td>
                <td>{formatWhen(access.lastSeenAt)}</td>
                <td>{access.blocked ? "bloqueado" : "liberado"}</td>
                <td className="row-actions">
                  <button
                    className="btn sm"
                    type="button"
                    disabled={busyId === access.id}
                    onClick={() => toggleBlock(access)}
                  >
                    {access.blocked ? "Liberar" : "Bloquear"}
                  </button>
                  <button
                    className="btn sm magenta"
                    type="button"
                    disabled={busyId === access.id}
                    onClick={() => setPending(access)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {report && report.accesses.length === 0 ? <p className="muted">{emptyLabel}</p> : null}
      </div>

      <div className="access-cards-mobile">
        {(report?.accesses || []).map((access) => (
          <article key={access.id} className="panel-card access-card-mobile">
            <div className="access-card-header">
              <code className="access-card-ip">{access.ip}</code>
              <span className={`access-card-status ${access.blocked ? "blocked" : "active"}`}>
                {access.blocked ? "bloqueado" : "liberado"}
              </span>
            </div>

            <div className="access-card-info">
              <div className="access-card-row">
                <span className="label">Localização:</span>
                <LocationBlock access={access} />
              </div>
              <div className="access-card-row">
                <span className="label">Acessos:</span>
                <span>{access.visitCount}</span>
              </div>
              <div className="access-card-row">
                <span className="label">Primeiro:</span>
                <span>{formatWhen(access.firstSeenAt)}</span>
              </div>
              <div className="access-card-row">
                <span className="label">Último:</span>
                <span>{formatWhen(access.lastSeenAt)}</span>
              </div>
            </div>

            <div className="access-card-actions">
              <button
                className="btn sm"
                type="button"
                disabled={busyId === access.id}
                onClick={() => toggleBlock(access)}
              >
                {access.blocked ? "Liberar" : "Bloquear"}
              </button>
              <button
                className="btn sm magenta"
                type="button"
                disabled={busyId === access.id}
                onClick={() => setPending(access)}
              >
                Excluir
              </button>
            </div>
          </article>
        ))}
        {report && report.accesses.length === 0 ? <p className="muted">{emptyLabel}</p> : null}
      </div>

      {pageCount > 1 ? (
        <div className="access-pager">
          <button className="btn sm ghost" type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
            Anterior
          </button>
          <span>
            Página {currentPage} de {pageCount}
          </span>
          <button
            className="btn sm ghost"
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Próxima
          </button>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(pending)}
        message={pending ? `Excluir o registro do IP ${pending.ip}? Essa ação não pode ser desfeita.` : ""}
        busy={Boolean(pending && busyId === pending.id)}
        onCancel={() => !busyId && setPending(null)}
        onConfirm={confirmRemove}
      />
    </>
  );
}
