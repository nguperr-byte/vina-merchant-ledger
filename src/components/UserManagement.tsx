import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Shield, Users, Trash2, Calendar, UserCheck, AlertCircle } from 'lucide-react';
import { UserAccount } from '../types';

interface UserManagementProps {
  users: UserAccount[];
  currentUser: UserAccount | null;
  onAddUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  onDeleteUser: (id: string) => void;
}

export default function UserManagement({ users, currentUser, onAddUser, onDeleteUser }: UserManagementProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setError('Please fill in all fields to register a user.');
      return;
    }

    if (username.trim().toLowerCase() === 'admin' && users.some(u => u.username === 'admin')) {
      setError('The username "admin" is reserved or already in use.');
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
      setError(`Username "${username}" is already taken.`);
      return;
    }

    onAddUser({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      passwordHash: password,
      role: role,
    });

    setSuccess(`Successfully created user "${fullName}"!`);
    setFullName('');
    setUsername('');
    setPassword('');
    setRole('user');
  };

  return (
    <div id="user-management-container" className="space-y-8 animate-fade-in">
      
      {/* Visual Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E2ECE8] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#00B875]/10 rounded-2xl flex items-center justify-center text-[#00B875]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0A1E1B] font-serif">Staff User Directory</h1>
            <p className="text-xs text-[#62837E] font-medium">
              Create, manage, and monitor account access for Cashiers and Administrators
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00B875]/5 border border-[#00B875]/20 rounded-xl text-xs font-semibold text-[#00B875]">
          <Shield className="w-4 h-4" />
          <span>Admin Access Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Creation Form - Left / Span 1 */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-[#E2ECE8] shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#E2ECE8]">
            <UserPlus className="w-5 h-5 text-[#00B875]" />
            <h2 className="text-base font-bold text-[#0A1E1B] font-serif">Create New User</h2>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#3C5A55] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                id="create-user-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Obi"
                className="w-full text-sm py-2 px-3 border border-[#C4DCD3] rounded-xl focus:border-[#00B875]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3C5A55] uppercase tracking-wider mb-1">
                Username (Lower case)
              </label>
              <input
                id="create-user-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. johnobi"
                className="w-full text-sm py-2 px-3 border border-[#C4DCD3] rounded-xl focus:border-[#00B875]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3C5A55] uppercase tracking-wider mb-1">
                Login Password
              </label>
              <input
                id="create-user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter simple password"
                className="w-full text-sm py-2 px-3 border border-[#C4DCD3] rounded-xl focus:border-[#00B875]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3C5A55] uppercase tracking-wider mb-1">
                Access Level / Role
              </label>
              <select
                id="create-user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                className="w-full text-sm py-2 px-3 border border-[#C4DCD3] rounded-xl focus:border-[#00B875]"
              >
                <option value="user">Standard User (Cashier access)</option>
                <option value="admin">Administrator (Full permission)</option>
              </select>
            </div>

            {error && (
              <div className="text-[#EF4444] text-xs font-semibold bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="text-[#00B875] text-xs font-semibold bg-[#00B875]/5 p-3 rounded-xl border border-[#00B875]/20 flex items-start gap-1.5">
                <UserCheck className="w-4 h-4 shrink-0 text-[#00B875]" />
                <span>{success}</span>
              </div>
            )}

            <button
              id="btn-create-user-submit"
              type="submit"
              className="w-full py-3 bg-[#00B875] hover:bg-[#009E64] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Account</span>
            </button>
          </form>
        </div>

        {/* Directory Listing Table - Right / Span 2 */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E2ECE8] shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E2ECE8]">
              <Users className="w-5 h-5 text-[#00B875]" />
              <h2 className="text-base font-bold text-[#0A1E1B] font-serif">System Registered Users</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2ECE8] text-[11px] font-black uppercase text-[#62837E] tracking-wider">
                    <th className="py-3 px-2">Staff Member</th>
                    <th className="py-3 px-2">Username</th>
                    <th className="py-3 px-2 text-center">Role Status</th>
                    <th className="py-3 px-2">Created Date</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2ECE8] text-xs">
                  {users.map((account) => {
                    const isSelf = currentUser && currentUser.id === account.id;
                    const isDefaultAdmin = account.username === 'admin';

                    return (
                      <tr key={account.id} className="hover:bg-[#F4F9F6]/40 transition">
                        <td className="py-3 px-2 font-bold text-[#0A1E1B]">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-[#00B875]/10 text-[#00B875] rounded-full flex items-center justify-center font-black">
                              {account.fullName[0]?.toUpperCase()}
                            </div>
                            <div>
                              <span>{account.fullName}</span>
                              {isSelf && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-[#00B875]/10 text-[#00B875] text-[9px] font-black rounded-md tracking-wider uppercase">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-mono text-[#3C5A55]">
                          @{account.username}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                            account.role === 'admin' 
                              ? 'bg-emerald-50' 
                              : 'bg-amber-50'
                          }`}>
                            {account.role}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-[#62837E] font-mono">
                          {new Date(account.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            id={`delete-user-btn-${account.id}`}
                            onClick={() => {
                              if (confirm(`Are you absolutely sure you want to delete user "${account.fullName}"?`)) {
                                onDeleteUser(account.id);
                              }
                            }}
                            disabled={isSelf || isDefaultAdmin}
                            title={isSelf ? "You cannot delete your own session" : isDefaultAdmin ? "Default admin cannot be deleted" : "Delete user"}
                            className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-20 disabled:pointer-events-none cursor-pointer inline-flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E2ECE8] flex items-center gap-2 text-[11px] text-[#62837E]">
            <AlertCircle className="w-4 h-4 text-[#FFA400] shrink-0" />
            <span>
              For security, standard **Users** can manage daily ledger sales and sourcing but cannot view detailed administrative audit reports or edit employee roles.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
