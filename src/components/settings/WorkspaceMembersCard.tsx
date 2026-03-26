"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { authFetch, getActiveWorkspaceId } from "@/lib/authClient";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Copy, Check, UserPlus, Users, Trash2, Loader2, Crown, ShieldCheck, User } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface InviteItem {
  id: string;
  role: string;
  expiresAt: string;
  usedAt: string | null;
}

const ROLE_ICONS: Record<string, typeof Crown> = {
  OWNER: Crown,
  ADMIN: ShieldCheck,
  MEMBER: User,
};

export function WorkspaceMembersCard() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const wid = getActiveWorkspaceId();

  const fetchData = useCallback(async () => {
    if (!wid) return;
    startTransition(() => setLoading(true));
    try {
      const [wsRes, invRes] = await Promise.all([
        authFetch(`/api/workspaces/${wid}`),
        authFetch(`/api/workspaces/${wid}/invites`),
      ]);
      if (wsRes.ok) {
        const data = await wsRes.json();
        startTransition(() => setMembers(data.members ?? []));
      }
      if (invRes.ok) {
        const data = await invRes.json();
        startTransition(() => setInvites(data.invites ?? []));
      }
    } catch { /* ignore */ }
    startTransition(() => setLoading(false));
  }, [wid]);

  useEffect(() => {
    if (!isAuthenticated || !wid) return;
    fetchData();
  }, [isAuthenticated, wid, fetchData]);

  if (!isAuthenticated || !wid) return null;

  const createInvite = async () => {
    if (!wid) return;
    setCreatingInvite(true);
    try {
      const res = await authFetch(`/api/workspaces/${wid}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: inviteRole }),
      });
      if (res.ok) {
        const data = await res.json();
        const link = `${window.location.origin}/invite/${data.token}`;
        setInviteLink(link);
        toast("Invite link created");
        fetchData();
      }
    } catch { /* ignore */ }
    setCreatingInvite(false);
  };

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInvite(true);
    toast("Invite link copied");
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const revokeInvite = async (inviteId: string) => {
    const res = await authFetch(`/api/workspaces/${wid}/invites/${inviteId}`, { method: "DELETE" });
    if (res.ok) {
      toast("Invite revoked");
      fetchData();
    }
  };

  const removeMember = async (memberId: string) => {
    const res = await authFetch(`/api/workspaces/${wid}/members/${memberId}`, { method: "DELETE" });
    if (res.ok) {
      toast("Member removed");
      fetchData();
    }
  };

  if (!isAuthenticated || !wid) return null;

  return (
    <div className="space-y-5">
      {/* ─── Members List ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Members</h3>
          <span className="text-xs text-gray-400">({members.length})</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Loader2 size={14} className="animate-spin" />
            Loading...
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const RoleIcon = ROLE_ICONS[m.role] || User;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <RoleIcon size={14} className={m.role === "OWNER" ? "text-amber-500" : m.role === "ADMIN" ? "text-blue-500" : "text-gray-400"} />
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {m.name || m.email}
                        {m.id === user?.id && <span className="ml-1 text-gray-400">(you)</span>}
                      </p>
                      <p className="text-[10px] text-gray-400">{m.role}</p>
                    </div>
                  </div>
                  {m.role !== "OWNER" && m.id !== user?.id && (
                    <button
                      onClick={() => removeMember(m.id)}
                      className="p-1 text-red-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Create Invite ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <UserPlus size={16} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Invite Members</h3>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "MEMBER" | "ADMIN")}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            onClick={createInvite}
            disabled={creatingInvite}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {creatingInvite ? "Creating..." : "Create Invite Link"}
          </button>
        </div>

        {inviteLink && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 dark:bg-indigo-900/20">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 bg-transparent text-xs text-indigo-700 dark:text-indigo-400 truncate"
            />
            <button
              onClick={copyInviteLink}
              className="p-1 text-indigo-500 hover:text-indigo-600"
            >
              {copiedInvite ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* ─── Active Invites ─── */}
      {invites.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">Pending Invites</h3>
          <div className="space-y-1">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
              >
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {inv.role} invite
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => revokeInvite(inv.id)}
                  className="p-1 text-red-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
