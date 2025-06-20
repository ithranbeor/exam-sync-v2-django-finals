// deno-lint-ignore-file no-explicit-any
import React, { useEffect, useState } from 'react';
import { FaTrash, FaEdit, FaSearch, FaRedoAlt } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient.ts';
import { ToastContainer, toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/accounts.css';

interface UserAccount {
  user_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email_address?: string;
  contact_number?: string;
  status: string;
  created_at: string;
}

interface AccountsProps {
  user: any;
}

export const Accounts: React.FC<AccountsProps> = ({ user }) => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingStatusId, setLoadingStatusId] = useState<string | null>(null);

  const [newAccount, setNewAccount] = useState<UserAccount>({
    user_id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    email_address: '',
    contact_number: '',
    status: 'Active',
    created_at: new Date().toISOString(),
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('view_user_accounts').select(`
      user_id, first_name, last_name, middle_name, email_address, contact_number, status, created_at
    `);

    if (error || !data) {
      toast.error('Error fetching accounts');
    } else {
      setAccounts(data);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddAccount = () => {
    setNewAccount({
      user_id: '',
      first_name: '',
      last_name: '',
      middle_name: '',
      email_address: '',
      contact_number: '',
      status: 'Active',
      created_at: new Date().toISOString(),
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSaveAccount = async () => {
    const {
      user_id, first_name, last_name, email_address,
      contact_number, status, middle_name
    } = newAccount;

    // Basic Validation
    if (!user_id || !first_name || !last_name || !email_address || !contact_number || !status) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase.from('tbl_users').update({
          first_name, last_name, middle_name, email_address, contact_number, status
        }).eq('user_id', Number(user_id));

        if (error) {
          toast.error('Failed to update user');
          return;
        }

        toast.success('Account updated');
      } else {
        // Create Auth only after validation passed
        const default_password = `${user_id}@${last_name}`;
        const response = await fetch('https://kfpgokxyjpyupyzsbzcd.supabase.co/functions/v1/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            user_id, first_name, last_name, middle_name,
            email_address, contact_number, status, password: default_password
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          toast.error(result.message || 'Error creating account');
          return;
        }

        toast.success('Account created!');
      }

      fetchAccounts();
      setShowModal(false);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error('Unexpected error occurred');
    }
  };


  const handleArchive = async (userId: string) => {
  setLoadingStatusId(userId);
  const { data, error } = await supabase
    .from('tbl_users')
    .update({ status: 'Suspended' })
    .eq('user_id', userId);

  console.log('suspend result', data, error);  // 🧪

  setLoadingStatusId(null);

  if (error) {
    toast.error(`Failed to suspend user: ${error.message}`);
  } else {
    toast.success('User suspended');
    fetchAccounts();
  }
};


  const handleReactivateAccount = async (userId: string) => {
    setLoadingStatusId(userId);
    const { error } = await supabase
      .from('tbl_users')
      .update({ status: 'Active' })
      .eq('user_id', userId);

    setLoadingStatusId(null);

    if (error) {
      toast.error('Failed to reactivate user');
    } else {
      toast.success('User reactivated');
      fetchAccounts();
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['user_id', 'first_name', 'last_name', 'middle_name', 'email_address', 'contact_number', 'status'],
      ['2022.....001', 'John', 'Doe', 'A.', 'john.doe@example.com', '09171234567', 'Active'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ImportTemplate');
    XLSX.writeFile(wb, 'Accounts_Import_Template.xlsx');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async evt => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(ws);

      for (const row of json) {
        const { user_id, first_name, last_name, middle_name, email_address, contact_number, status } = row;

        // Validate each row before submitting
        if (!user_id || !first_name || !last_name || !email_address || !contact_number || !status) {
          toast.error(`Missing fields in row for user ID: ${user_id || 'unknown'}`);
          continue;
        }

        const default_password = `${user_id}@${last_name}`;
        try {
          const response = await fetch('https://kfpgokxyjpyupyzsbzcd.supabase.co/functions/v1/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              user_id, first_name, last_name, middle_name,
              email_address, contact_number, status, password: default_password
            }),
          });

          const result = await response.json();
          if (!response.ok) {
            toast.error(`Failed to create ${first_name} (${user_id}): ${result.message}`);
            continue;
          }
        } catch (err) {
          console.error(err);
          toast.error(`Error creating ${first_name} (${user_id})`);
        }
      }

      toast.success('Import completed');
      fetchAccounts();
      setShowImport(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const filtered = accounts.filter(u =>
    `${u.user_id} ${u.first_name} ${u.last_name} ${u.middle_name ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email_address ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.contact_number ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="accounts-container">
      <div className="accounts-header">
        <h2 className="accounts-title">Manage Accounts</h2>
        <div className="search-bar">
          <input placeholder="Search..." value={searchTerm} onChange={handleSearchChange} />
          <button type="button" className="search-button"><FaSearch /></button>
        </div>
      </div>

      <div className="accounts-actions">
        <button type="button" className="action-button add-new" onClick={handleAddAccount}>Add New Account</button>
        <button type="button" className="action-button import" onClick={() => setShowImport(true)}>Import Accounts</button>
      </div>

      <div className="accounts-table-container">
        <table className="accounts-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Account Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}>No user accounts found.</td></tr>
            ) : filtered.map(u => (
              <tr key={u.user_id}>
                <td>{u.user_id}</td>
                <td>{u.last_name}, {u.first_name} {u.middle_name ?? ''}</td>
                <td>{u.email_address}</td>
                <td>{u.contact_number}</td>
                <td>
                  <span className={`status-tag ${u.status.toLowerCase() === 'active' ? 'status-active' : 'status-suspended'}`}>
                    {u.status}
                  </span>
                </td>
                <td>{new Date(u.created_at).toLocaleString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}</td>
                <td className="action-buttons">
                  <button type="button" className="icon-button edit-button" onClick={() => {
                    setNewAccount(u);
                    setIsEditing(true);
                    setShowModal(true);
                  }}>
                    <FaEdit />
                  </button>
                  {u.status === 'Suspended' ? (
                    <button type="button"
                      className="icon-button reactivate-button"
                      onClick={() => handleReactivateAccount(u.user_id)}
                      disabled={loadingStatusId === u.user_id}
                    >
                      {loadingStatusId === u.user_id ? '...' : <FaRedoAlt />}
                    </button>
                  ) : (
                    <button type="button"
                      className="icon-button delete-button"
                      onClick={() => handleArchive(u.user_id)}
                      disabled={loadingStatusId === u.user_id}
                    >
                      {loadingStatusId === u.user_id ? '...' : <FaTrash />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <h4 style={{ textAlign: 'center' }}>{isEditing ? 'Edit Account' : 'Add New Account'}</h4>
              {['user_id', 'first_name', 'last_name', 'middle_name', 'email_address', 'contact_number'].map((field) => (
                <div key={field} className="input-group">
                  <label htmlFor={field}>{field.replace('_', ' ').toUpperCase()}</label>
                  <input
                    id={field}
                    value={(newAccount as any)[field]}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, [field]: e.target.value }))}
                    disabled={field === 'user_id' && isEditing}
                  />
                </div>
              ))}
              <div className="input-group">
                <label htmlFor="status">STATUS</label>
                <select
                  id="status"
                  value={newAccount.status}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="button" className="modal-button save" onClick={handleSaveAccount}>Save</button>
                <button type="button" className="modal-button cancel" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content import-modal">
              <h4 style={{ textAlign: 'center' }}>Import Accounts from Excel</h4>
              <div className="input-group">
                <label>Upload Excel File</label>
                <input type="file" accept=".xlsx, .xls" onChange={handleImport} />
              </div>
              <div className="modal-buttons">
                <button type="button" className="modal-button download" onClick={downloadTemplate}>📥 Download Template</button>
                <button type="button" className="modal-button save" onClick={() => setShowImport(false)}>Done</button>
                <button type="button" className="modal-button cancel" onClick={() => setShowImport(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Accounts;
