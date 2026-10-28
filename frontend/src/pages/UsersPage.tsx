import { useState, type FormEvent } from "react";
import { usersApi } from "../api/endpoints";
import type { Role, UserListItem } from "../api/types";
import { ActiveBadge, RoleBadge } from "../components/Badges";
import { ErrorMessage, PageHeader, Spinner } from "../components/Feedback";
import { Modal } from "../components/Modal";
import { ROLES, ROLE_LABELS } from "../constants";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";

/** Create a user (when `user` is empty) or edit one. */
function UserFormModal({ user, onClose, onSaved }: { user?: UserListItem; onClose: () => void; onSaved: () => void }) {
  const isEdit = user !== undefined;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "EMPLOYEE");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (user) {
        await usersApi.update(user._id, { name, role, isActive, ...(password ? { password } : {}) });
      } else {
        await usersApi.create({ name, email, password, role });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the user");
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit user" : "New user"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} />
        <div>
          <label className="label" htmlFor="u-name">Name</label>
          <input id="u-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </div>
        <div>
          <label className="label" htmlFor="u-email">Email</label>
          <input id="u-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isEdit} />
        </div>
        <div>
          <label className="label" htmlFor="u-pass">{isEdit ? "New password (leave empty to keep the current one)" : "Password"}</label>
          <input id="u-pass" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required={!isEdit} minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="u-role">Role</label>
          <select id="u-role" className="input" value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={Boolean(user?.team)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          {user?.team && <p className="mt-1 text-xs text-slate-500">Remove this user from their team before changing the role.</p>}
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Account is active (untick to deactivate)
          </label>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

export function UsersPage() {
  const { user: me } = useAuth();
  const users = useFetch(() => usersApi.list(), []);
  const [editing, setEditing] = useState<UserListItem | "new" | null>(null);

  return (
    <>
      <PageHeader title="Users" subtitle="Create users, change roles and deactivate accounts" actions={<button className="btn-primary" onClick={() => setEditing("new")}>+ New user</button>} />
      {users.loading && !users.data && <Spinner />}
      <ErrorMessage message={users.error} />

      {users.data && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.data.map((u) => (
                <tr key={u._id} className={u.isActive ? "" : "text-slate-400"}>
                  <td className="px-4 py-3 font-medium">{u.name}{u._id === me?._id && " (you)"}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3">{u.team?.name ?? "-"}</td>
                  <td className="px-4 py-3"><ActiveBadge active={u.isActive} /></td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-indigo-600 hover:underline" onClick={() => setEditing(u)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <UserFormModal
          user={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            users.reload();
          }}
        />
      )}
    </>
  );
}
