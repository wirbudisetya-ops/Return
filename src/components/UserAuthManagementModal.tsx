import React, { useState } from "react";
import {
  X,
  Shield,
  ShieldCheck,
  UserPlus,
  Mail,
  User,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  KeyRound,
  Edit2,
  Check,
  UserCheck,
} from "lucide-react";
import { AuthorizedUser, StaffRole, DistributionCenter } from "../types";
import { PRIMARY_ADMIN_EMAIL, getPermissionsByRole } from "../data/firebase";

interface UserAuthManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AuthorizedUser[];
  onAddUser: (user: AuthorizedUser) => void;
  onUpdateUser: (user: AuthorizedUser) => void;
  onDeleteUser: (email: string) => void;
  currentUserEmail?: string;
  onSwitchUser?: (user: AuthorizedUser) => void;
}

export const UserAuthManagementModal: React.FC<UserAuthManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUserEmail,
  onSwitchUser,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);

  // Form State
  const [emailInput, setEmailInput] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [roleInput, setRoleInput] = useState<StaffRole>("OPERATOR_SOLO");
  const [allowedDCsInput, setAllowedDCsInput] = useState<DistributionCenter[]>(["DC_SOLO"]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleDC = (dc: DistributionCenter) => {
    if (allowedDCsInput.includes(dc)) {
      if (allowedDCsInput.length > 1) {
        setAllowedDCsInput(allowedDCsInput.filter((d) => d !== dc));
      }
    } else {
      setAllowedDCsInput([...allowedDCsInput, dc]);
    }
  };

  const handleRoleChange = (role: StaffRole) => {
    setRoleInput(role);
    const defaults = getPermissionsByRole(role);
    setAllowedDCsInput(defaults.allowedDCs);
  };

  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrim = emailInput.trim().toLowerCase();
    if (!emailTrim || !emailTrim.includes("@")) {
      setErrorMessage("Masukkan alamat email yang valid.");
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === emailTrim)) {
      setErrorMessage("Email ini sudah terdaftar dalam daftar otorisasi.");
      return;
    }

    const perms = getPermissionsByRole(roleInput);
    const newUser: AuthorizedUser = {
      email: emailTrim,
      displayName: displayNameInput.trim() || emailTrim.split("@")[0],
      role: roleInput,
      allowedDCs: allowedDCsInput,
      status: "ACTIVE",
      canEditReturns: perms.canEditReturns,
      canConfirmOperator: perms.canConfirmOperator,
      canProcessManualReturns: perms.canProcessManualReturns,
      canManageUsers: perms.canManageUsers,
      addedAt: new Date().toISOString(),
      addedBy: currentUserEmail || PRIMARY_ADMIN_EMAIL,
    };

    onAddUser(newUser);
    setSuccessMessage(`Pengguna ${newUser.email} berhasil diotorisasi sebagai ${newUser.role}!`);
    setEmailInput("");
    setDisplayNameInput("");
    setShowAddForm(false);

    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleToggleStatus = (user: AuthorizedUser) => {
    if (user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) return;
    const newStatus = user.status === "ACTIVE" ? "REVOKED" : "ACTIVE";
    onUpdateUser({
      ...user,
      status: newStatus,
    });
  };

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">SUPER ADMIN</span>;
      case "OPERATOR_SOLO":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">OPERATOR SOLO</span>;
      case "OPERATOR_JOGJA":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">OPERATOR JOGJA</span>;
      case "INBOUND_STAFF":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">INBOUND STAFF</span>;
      case "VIEWER":
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">VIEWER (LIHAT SAJA)</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4.5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Otorisasi Pengguna & Akses Email
                </h2>
                <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 uppercase font-bold">
                  Firebase Auth RBAC
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Kelola email staf yang diizinkan masuk dan mengedit data retur PT ABC.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Info Banner */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-950 flex items-start gap-3">
            <Shield className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                Sistem Otorisasi Berbasis Email (Role-Based Access Control)
              </p>
              <p className="text-indigo-800 text-[11px] leading-relaxed">
                Hanya pengguna dengan email yang terdaftar di bawah ini yang dapat mengakses fitur edit, serah terima retur, dan konfirmasi. Akun utama <strong>{PRIMARY_ADMIN_EMAIL}</strong> memiliki hak Super Admin permanen.
              </p>
            </div>
          </div>

          {/* Action Bar: Add User Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Daftar Email Terdaftar ({users.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? "Tutup Form" : "+ Tambah Email Pengguna"}</span>
            </button>
          </div>

          {/* Form Tambah Pengguna */}
          {showAddForm && (
            <form
              onSubmit={handleSaveNewUser}
              className="p-4 bg-slate-50 border border-indigo-200 rounded-xl space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Otorisasi Email Pengguna Baru</span>
                </span>
                <span className="text-[11px] text-slate-500">Isi detail akun staf</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Email Staf <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="contoh: budi@ptabc.co.id"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Staf / Operator
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="contoh: Budi Hartono"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role & Hak Akses
                  </label>
                  <select
                    value={roleInput}
                    onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="OPERATOR_SOLO">OPERATOR RETUR SOLO (Full Akses DC Solo)</option>
                    <option value="OPERATOR_JOGJA">OPERATOR RETUR JOGJA (Full Akses DC Jogja)</option>
                    <option value="INBOUND_STAFF">INBOUND STAFF (Input Penerimaan Toko)</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN (Semua DC & Kelola Akses)</option>
                    <option value="VIEWER">VIEWER (Hanya Lihat / Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Akses Pusat Distribusi (DC)
                  </label>
                  <div className="flex items-center space-x-3 pt-1">
                    <label className="flex items-center space-x-1.5 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={allowedDCsInput.includes("DC_SOLO")}
                        onChange={() => handleToggleDC("DC_SOLO")}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>DC Solo</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={allowedDCsInput.includes("DC_JOGJA")}
                        onChange={() => handleToggleDC("DC_JOGJA")}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>DC Jogja</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan & Beri Akses</span>
                </button>
              </div>
            </form>
          )}

          {/* User List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Pengguna / Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Akses DC</th>
                  <th className="py-2.5 px-3">Izin Edit</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => {
                  const isCurrent = currentUserEmail?.toLowerCase() === user.email.toLowerCase();
                  const isOwner = user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();

                  return (
                    <tr
                      key={user.email}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrent ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-start space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0 mt-0.5">
                            {user.displayName?.charAt(0) || user.email.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{user.displayName}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-600 text-white uppercase font-mono">
                                  Anda
                                </span>
                              )}
                              {isOwner && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-600 text-white uppercase font-mono">
                                  Utama
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">{getRoleBadge(user.role)}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {user.allowedDCs.map((dc) => (
                            <span
                              key={dc}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {dc === "DC_SOLO" ? "Solo" : "Jogja"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {user.canEditReturns ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                            <Check className="w-3 h-3" />
                            <span>Bisa Edit</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                            <X className="w-3 h-3" />
                            <span>Hanya Lihat</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={isOwner}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                            user.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                          } ${isOwner ? "cursor-not-allowed opacity-90" : ""}`}
                          title={isOwner ? "Akun pemilik utama tidak dapat dinonaktifkan" : "Klik untuk ubah status"}
                        >
                          {user.status === "ACTIVE" ? "AKTIF" : "NONAKTIF"}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Test Login as this user */}
                          {onSwitchUser && !isCurrent && (
                            <button
                              type="button"
                              onClick={() => onSwitchUser(user)}
                              className="px-2 py-1 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                              title="Masuk sebagai pengguna ini"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Masuk</span>
                            </button>
                          )}

                          {/* Delete button (except owner) */}
                          {!isOwner && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus akses otorisasi untuk ${user.email}?`)) {
                                  onDeleteUser(user.email);
                                }
                              }}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                              title="Hapus Otorisasi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* SOP Notice */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <span>
              ℹ️ Pengguna tambahan dapat login menggunakan tombol <strong>Login Google / Email</strong> di pojok kanan atas.
            </span>
            <span className="font-mono text-slate-400">Total: {users.length} akun terdaftar</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
