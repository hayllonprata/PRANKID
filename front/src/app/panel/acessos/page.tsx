"use client";

import { useEffect, useState } from "react";
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
  userAgent: string;
  blocked: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
};

type AccessReport = {
  uniqueIps: number;
  totalVisits: number;
  blockedCount: number;
  accesses: SiteAccess[];
};

function formatWhen(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function formatLocation(access: SiteAccess) {
  const parts = [access.city, access.region, access.country].filter(Boolean);
  if (parts.length) {
    return access.countryCode ? `${parts.join(" · ")} (${access.countryCode})` : parts.join(" · ");
  }
  return "Localização não identificada";
}

function mapsUrl(access: SiteAccess) {
  if (access.latitude == null || access.longitude == null) return "";
  return `https://www.google.com/maps?q=${access.latitude},${access.longitude}`;
}

export default function AccessesPage() {
  const [report, setReport] = useState<AccessReport | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [pending, setPending] = useState<SiteAccess | null>(null);

  async function load() {
    try {
      setReport(await api<AccessReport>("/api/admin/accesses"));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar acessos");
    }
  }

  useEffect(() => {
    load();
  }, []);

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

  return (
    <>
      <h1>Acessos</h1>
      <p className="muted">
        Cada IP entra uma vez nesta lista (sem duplicar visitantes). A quantidade de acessos sobe só quando o mesmo IP
        volta depois de 30 minutos. A localização vem da geolocalização do IP.
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
          <p className="muted">IPs bloqueados</p>
          <strong>{report ? report.blockedCount : "…"}</strong>
        </article>
      </div>

      <div className="panel-card" style={{ overflowX: "auto" }}>
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
            {(report?.accesses || []).map((access) => {
              const map = mapsUrl(access);
              return (
                <tr key={access.id}>
                  <td>
                    <code>{access.ip}</code>
                  </td>
                  <td>
                    {formatLocation(access)}
                    {map ? (
                      <>
                        {" "}
                        <a href={map} target="_blank" rel="noreferrer">
                          mapa
                        </a>
                      </>
                    ) : null}
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
              );
            })}
          </tbody>
        </table>
        {report && report.accesses.length === 0 ? <p className="muted">Nenhum acesso registrado ainda.</p> : null}
      </div>
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
