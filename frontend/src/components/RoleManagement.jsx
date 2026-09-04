import React, { useState } from 'react';
import { ShieldCheck, UserPlus, Trash2, Mail, CheckCircle2, AlertCircle, Sparkles, Lock } from 'lucide-react';
import { getApprovedSuperAdmins, addApprovedSuperAdmin, removeApprovedSuperAdmin } from '../lib/firebase';

export default function RoleManagement({ currentUser, isSuperAdmin }) {
  const [admins, setAdmins] = useState(getApprovedSuperAdmins());
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState(null);

  const handleAddAdmin = (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid Gmail address' });
      return;
    }
    const updated = addApprovedSuperAdmin(newEmail.trim());
    setAdmins(updated);
    setMessage({ type: 'success', text: `Super Admin role assigned to ${newEmail.trim()}` });
    setNewEmail('');
  };

  const handleRemoveAdmin = (emailToRemove) => {
    if (admins.length <= 1) {
      setMessage({ type: 'error', text: 'Cannot remove the last remaining Super Admin' });
      return;
    }
    const updated = removeApprovedSuperAdmin(emailToRemove);
    setAdmins(updated);
    setMessage({ type: 'success', text: `Super Admin role revoked from ${emailToRemove}` });
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto text-orange-600">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900">Super Admin Access Required</h2>
        <p className="text-sm text-stone-600">
          Role Management is restricted to authorized Super Admins. Please log in with an approved Super Admin Gmail account.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Super Admin Access Control
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900">Gmail Role & Permission Management</h2>
        <p className="text-xs text-stone-600">
          Any user signing in with a standard Gmail account enters as a <span className="font-semibold text-stone-900">Citizen</span>. 
          Gmail addresses added below are automatically granted <span className="font-semibold text-orange-600">Super Admin</span> privileges (GIS Map, Data Fusion, DPR Synthesizer, & Role Control).
        </p>
      </div>

      {/* Add New Super Admin Form */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-orange-600" /> Assign New Super Admin Role
        </h3>
        
        <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="w-5 h-5 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter official Gmail address (e.g. officer@gmail.com)"
              className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Assign Super Admin
          </button>
        </form>

        {message && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Active Super Admin List */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">Approved Super Admin Gmail Registry</h3>
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
            {admins.length} Active Admins
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {admins.map((email) => {
            const isSelf = currentUser?.email?.toLowerCase() === email.toLowerCase();
            return (
              <div key={email} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                    {email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-stone-900">{email}</span>
                      {isSelf && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          YOU (Active Session)
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-500">Super Admin â€¢ Full Access Granted</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveAdmin(email)}
                  disabled={isSelf}
                  className="text-stone-400 hover:text-rose-600 disabled:opacity-30 p-2 rounded-lg hover:bg-rose-50 transition-all"
                  title="Revoke Admin Access"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
