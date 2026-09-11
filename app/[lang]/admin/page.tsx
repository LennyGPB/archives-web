"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";

type AdminUser = {
  id: string;
  pseudo: string;
  email: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
  transmissionCredits: number;
  createdAt: string;
  totalArchives: number;
};

type OwnedArchive = {
  id: string;
  exemplaireNumber: number;
  obtainedAt: string;
  isFavorite: boolean;
  archive: { id: string; name: string; frontImageUrl: string | null; rarity: { tier: string; label: string } };
};

type AdminUserDetail = AdminUser & { ownedArchives: OwnedArchive[] };

type AdminArchive = {
  id: string;
  name: string;
  slug: string;
  frontImageUrl: string | null;
  totalExemplaires: number;
  rarity: { tier: string; label: string };
  category: { label: string };
  season: { name: string };
};

const inputClass =
  "h-10 border border-white/15 bg-white/[.03] px-3 font-[family-name:var(--font-geist-mono)] text-xs tracking-wide text-[#f4f3ef] outline-none focus-visible:border-[#86a98d]/70";
const buttonClass =
  "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 border border-[#86a98d]/55 bg-[#86a98d]/12 px-4 font-[family-name:var(--font-geist-mono)] text-[10px] font-semibold tracking-widest text-[#dce9df] transition-[border-color,background-color] hover:border-[#b8d2bd] hover:bg-[#86a98d]/22 disabled:cursor-not-allowed disabled:opacity-40";

async function apiFetch<T>(authFetch: (input: string, init?: RequestInit) => Promise<Response>, path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(path, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error((body && typeof body === "object" && "message" in body ? String(body.message) : null) ?? `Erreur ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export default function AdminPage() {
  const { lang } = useI18n();
  const router = useRouter();
  const { user, isReady, isAuthenticated, authFetch } = useAuth();

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [archives, setArchives] = useState<AdminArchive[] | null>(null);
  const [selectedArchiveIds, setSelectedArchiveIds] = useState<Set<string>>(new Set());
  const [bulkGranting, setBulkGranting] = useState(false);
  const [bulkGrantError, setBulkGrantError] = useState<string | null>(null);

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const [creditsAmount, setCreditsAmount] = useState("1");
  const [grantingCredits, setGrantingCredits] = useState(false);
  const [creditsError, setCreditsError] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || !isAdmin) router.replace(`/${lang}`);
  }, [isReady, isAuthenticated, isAdmin, router, lang]);

  const loadUsers = useCallback(() => {
    setUsersError(null);
    apiFetch<AdminUser[]>(authFetch, "/api/admin/users")
      .then(setUsers)
      .catch((error: unknown) => setUsersError(error instanceof Error ? error.message : "Impossible de charger les utilisateurs."));
  }, [authFetch]);

  useEffect(() => {
    if (isReady && isAuthenticated && isAdmin) loadUsers();
  }, [isReady, isAuthenticated, isAdmin, loadUsers]);

  useEffect(() => {
    if (isReady && isAuthenticated && isAdmin && archives === null) {
      apiFetch<AdminArchive[]>(authFetch, "/api/admin/archives")
        .then(setArchives)
        .catch(() => setArchives([]));
    }
  }, [isReady, isAuthenticated, isAdmin, archives, authFetch]);

  const loadDetail = useCallback(
    (userId: string) => {
      setDetailLoading(true);
      setDetailError(null);
      setBulkGrantError(null);
      setRevokeError(null);
      apiFetch<AdminUserDetail>(authFetch, `/api/admin/users/${userId}`)
        .then(setDetail)
        .catch((error: unknown) => setDetailError(error instanceof Error ? error.message : "Impossible de charger ce profil."))
        .finally(() => setDetailLoading(false));
    },
    [authFetch],
  );

  const selectUser = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedArchiveIds(new Set());
    setCreditsAmount("1");
    loadDetail(userId);
  };

  const toggleArchive = (archiveId: string) => {
    setSelectedArchiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(archiveId)) next.delete(archiveId);
      else next.add(archiveId);
      return next;
    });
  };

  const allArchivesSelected = archives !== null && archives.length > 0 && selectedArchiveIds.size === archives.length;

  const toggleSelectAll = () => {
    if (!archives) return;
    setSelectedArchiveIds(allArchivesSelected ? new Set() : new Set(archives.map((archive) => archive.id)));
  };

  const grantBulk = async (body: { all: true } | { archiveIds: string[] }) => {
    if (!selectedUserId) return;
    setBulkGranting(true);
    setBulkGrantError(null);
    try {
      await apiFetch(authFetch, `/api/admin/users/${selectedUserId}/archives/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSelectedArchiveIds(new Set());
      loadDetail(selectedUserId);
      loadUsers();
    } catch (error) {
      setBulkGrantError(error instanceof Error ? error.message : "Impossible d'attribuer ces Archives.");
    } finally {
      setBulkGranting(false);
    }
  };

  const handleGrantSelected = () => void grantBulk({ archiveIds: Array.from(selectedArchiveIds) });
  const handleGrantAll = () => void grantBulk({ all: true });

  const handleGrantCredits = async () => {
    if (!selectedUserId) return;
    const amount = Number.parseInt(creditsAmount, 10);
    if (!Number.isInteger(amount) || amount < 1) {
      setCreditsError("Indique un nombre entier positif.");
      return;
    }
    setGrantingCredits(true);
    setCreditsError(null);
    try {
      await apiFetch(authFetch, `/api/admin/users/${selectedUserId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      loadDetail(selectedUserId);
      loadUsers();
    } catch (error) {
      setCreditsError(error instanceof Error ? error.message : "Impossible d'attribuer ces transmissions.");
    } finally {
      setGrantingCredits(false);
    }
  };

  const handleRevoke = async (userArchiveId: string) => {
    if (!selectedUserId) return;
    setRevokingId(userArchiveId);
    setRevokeError(null);
    try {
      await apiFetch(authFetch, `/api/admin/user-archives/${userArchiveId}`, { method: "DELETE" });
      loadDetail(selectedUserId);
      loadUsers();
    } catch (error) {
      setRevokeError(error instanceof Error ? error.message : "Impossible de retirer cet exemplaire.");
    } finally {
      setRevokingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((entry) => entry.pseudo.toLowerCase().includes(query) || entry.email.toLowerCase().includes(query));
  }, [users, search]);

  if (!isReady || !isAuthenticated || !isAdmin) {
    return <main className="min-h-svh bg-[#08090a]" />;
  }

  return (
    <main className="min-h-svh bg-[#08090a] px-6 pt-28 pb-24 text-[#f4f3ef] md:px-16">
      <div className="mx-auto max-w-7xl">
        <p className="m-0 font-[family-name:var(--font-geist-mono)] text-xs tracking-widest text-[#86a98d]">ESPACE ADMIN</p>
        <h1 className="m-0 mt-2 font-[family-name:var(--font-alumni-sans)] text-5xl font-semibold tracking-wide">Gestion des utilisateurs</h1>

        <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
          <section className="border border-white/10 bg-white/[.02] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 font-[family-name:var(--font-alumni-sans)] text-2xl font-semibold">Utilisateurs</h2>
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-widest text-white/40">{users?.length ?? "—"}</span>
            </div>
            <input
              className={`${inputClass} mt-4 w-full`}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un pseudo ou un email…"
              value={search}
            />

            {usersError && <p className="mt-4 text-sm text-[#e6a0a0]">{usersError}</p>}

            <ul className="mt-4 flex max-h-[65svh] flex-col gap-1.5 overflow-y-auto">
              {filteredUsers.map((entry) => (
                <li key={entry.id}>
                  <button
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 border px-3 py-2.5 text-left transition-colors ${
                      selectedUserId === entry.id ? "border-[#86a98d]/70 bg-[#86a98d]/12" : "border-white/10 bg-transparent hover:border-white/25 hover:bg-white/[.04]"
                    }`}
                    onClick={() => selectUser(entry.id)}
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{entry.pseudo}</span>
                      <span className="block truncate font-[family-name:var(--font-geist-mono)] text-[10px] text-white/40">{entry.email}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {entry.role === "ADMIN" && (
                        <span className="border border-[#86a98d]/50 bg-[#86a98d]/15 px-1.5 py-0.5 font-[family-name:var(--font-geist-mono)] text-[8px] tracking-widest text-[#b8d2bd]">ADMIN</span>
                      )}
                      <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tabular-nums text-white/50">{entry.totalArchives}</span>
                    </span>
                  </button>
                </li>
              ))}
              {users && filteredUsers.length === 0 && <li className="py-6 text-center text-sm text-white/40">Aucun utilisateur trouvé.</li>}
            </ul>
          </section>

          <section className="border border-white/10 bg-white/[.02] p-5">
            {!selectedUserId ? (
              <p className="py-12 text-center text-sm text-white/40">Sélectionne un utilisateur pour voir son détail.</p>
            ) : detailLoading ? (
              <p className="py-12 text-center text-sm text-white/40">Chargement…</p>
            ) : detailError ? (
              <p className="py-12 text-center text-sm text-[#e6a0a0]">{detailError}</p>
            ) : detail ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
                  <div>
                    <h2 className="m-0 font-[family-name:var(--font-alumni-sans)] text-3xl font-semibold">{detail.pseudo}</h2>
                    <p className="m-0 mt-1 font-[family-name:var(--font-geist-mono)] text-xs text-white/40">{detail.email}</p>
                  </div>
                  <div className="flex gap-6 font-[family-name:var(--font-geist-mono)] text-xs text-white/50">
                    <span>{detail.ownedArchives.length} archive(s)</span>
                    <span>{detail.transmissionCredits} crédit(s)</span>
                  </div>
                </div>

                <div className="mt-6 border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex cursor-pointer items-center gap-2 font-[family-name:var(--font-geist-mono)] text-[10px] tracking-widest text-white/50">
                      <input checked={allArchivesSelected} onChange={toggleSelectAll} type="checkbox" />
                      TOUT SÉLECTIONNER ({selectedArchiveIds.size}/{archives?.length ?? 0})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={buttonClass}
                        disabled={selectedArchiveIds.size === 0 || bulkGranting}
                        onClick={handleGrantSelected}
                        type="button"
                      >
                        {bulkGranting ? "Attribution…" : `Donner la sélection (${selectedArchiveIds.size})`}
                      </button>
                      <button className={buttonClass} disabled={!archives?.length || bulkGranting} onClick={handleGrantAll} type="button">
                        {bulkGranting ? "Attribution…" : "Tout donner"}
                      </button>
                    </div>
                  </div>

                  <ul className="mt-3 flex max-h-56 flex-col gap-1 overflow-y-auto">
                    {archives?.map((archive) => (
                      <li key={archive.id}>
                        <label className="flex cursor-pointer items-center gap-2.5 px-1 py-1 text-sm hover:bg-white/[.03]">
                          <input checked={selectedArchiveIds.has(archive.id)} onChange={() => toggleArchive(archive.id)} type="checkbox" />
                          <span className="min-w-0 flex-1 truncate">{archive.name}</span>
                          <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[10px] text-white/40">
                            {archive.rarity.label} · {archive.season.name}
                          </span>
                        </label>
                      </li>
                    ))}
                    {archives && archives.length === 0 && <li className="py-4 text-center text-sm text-white/40">Aucune Archive disponible.</li>}
                  </ul>
                </div>
                {bulkGrantError && <p className="mt-2 text-sm text-[#e6a0a0]">{bulkGrantError}</p>}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <input
                    className={`${inputClass} w-28`}
                    min={1}
                    onChange={(event) => setCreditsAmount(event.target.value)}
                    type="number"
                    value={creditsAmount}
                  />
                  <button className={buttonClass} disabled={grantingCredits} onClick={() => void handleGrantCredits()} type="button">
                    {grantingCredits ? "Attribution…" : "Donner des transmissions"}
                  </button>
                </div>
                {creditsError && <p className="mt-2 text-sm text-[#e6a0a0]">{creditsError}</p>}
                {revokeError && <p className="mt-2 text-sm text-[#e6a0a0]">{revokeError}</p>}

                <h3 className="m-0 mt-8 font-[family-name:var(--font-geist-mono)] text-[10px] tracking-widest text-white/40">EXEMPLAIRES POSSÉDÉS</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {detail.ownedArchives.map((owned) => (
                    <li className="flex items-center justify-between gap-3 border border-white/10 bg-black/20 px-4 py-3" key={owned.id}>
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm">{owned.archive.name}</p>
                        <p className="m-0 mt-0.5 font-[family-name:var(--font-geist-mono)] text-[10px] text-white/40">
                          {owned.archive.rarity.label} · Nº{String(owned.exemplaireNumber).padStart(3, "0")}
                        </p>
                      </div>
                      <button
                        className="shrink-0 cursor-pointer border border-[#e6a0a0]/40 bg-[#e6a0a0]/10 px-3 py-1.5 font-[family-name:var(--font-geist-mono)] text-[9px] font-semibold tracking-widest text-[#e6a0a0] transition-colors hover:border-[#e6a0a0]/70 hover:bg-[#e6a0a0]/20 disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={revokingId === owned.id}
                        onClick={() => void handleRevoke(owned.id)}
                        type="button"
                      >
                        {revokingId === owned.id ? "…" : "Retirer"}
                      </button>
                    </li>
                  ))}
                  {detail.ownedArchives.length === 0 && <li className="py-6 text-center text-sm text-white/40">Aucune Archive possédée.</li>}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
