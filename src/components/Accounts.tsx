// deno-lint-ignore-file no-explicit-any
import React, { useEffect, useState } from 'react';
import { FaTrash, FaEdit, FaSearch } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient.ts';
import { ToastContainer, toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/accounts.css';

interface UserAccount {
  user_id: string;
  username?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email_address?: string;
  contact_number?: string;
  status: string;
  role: string;
}

interface Role {
  role_id: string;
  role_name: string;
}

interface AccountsProps {
  user: any;
}

export const Accounts: React.FC<AccountsProps> = ({ user }) => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [newAccount, setNewAccount] = useState({
    user_id: '',
    username: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    email_address: '',
    contact_number: '',
    status: 'Active',
    role_id: [] as string[],
  });

  useEffect(() => {
    fetchAccounts();
    fetchRoles();
  }, []);

  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('view_user_accounts').select('*');
    if (error || !data) return toast.error('Error fetching accounts');
    setAccounts(
      data.map((u: any) => ({
        user_id: u.user_id,
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
        middle_name: u.middle_name,
        email_address: u.email_address,
        contact_number: u.contact_number,
        status: u.status,
        role: u.roles || 'N/A',
      }))
    );
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase.from('tbl_roles').select('*');
    if (!error && data) setRoles(data);
  };

  const handleSearchChange = (e: any) => setSearchTerm(e.target.value);

  const handleArchive = async (userId: string) => {
    const { error } = await supabase
      .from('tbl_users')
      .update({ status: 'Suspended' })
      .eq('user_id', userId);

    if (error) toast.error('Failed to suspend account');
    else {
      toast.success('Account suspended');
      fetchAccounts();
    }
  };


  const handleAddAccount = () => {
    setNewAccount({
      user_id: '',
      username: '',
      first_name: '',
      last_name: '',
      middle_name: '',
      email_address: '',
      contact_number: '',
      status: 'Active',
      role_id: [],
    });
    setShowModal(true);
  };

  const handleSaveAccount = async () => {
    const {
      user_id,
      username,
      first_name,
      last_name,
      email_address,
      contact_number,
      role_id,
      status,
      middle_name,
    } = newAccount;

    if (!user_id || !username || !first_name || !last_name || !email_address || role_id.length === 0) {
      return toast.error('Please fill all required fields');
    }

    try {
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('tbl_users')
          .update({
            username,
            first_name,
            last_name,
            middle_name,
            email_address,
            contact_number,
            status,
          })
          .eq('user_id', user_id);

        if (updateError) {
          toast.error('Failed to update user');
          return;
        }

        await supabase.from('tbl_user_roles').delete().eq('user_id', user_id);
        const { error: roleError } = await supabase
          .from('tbl_user_roles')
          .insert(role_id.map(rid => ({ user_id, role_id: rid })));

        if (roleError) {
          toast.error('Updated user but failed role assignment');
          return;
        }

        toast.success('Account updated');
      } else {
        const default_password = `${user_id}@${last_name}`;
        const response = await fetch('https://kfpgokxyjpyupyzsbzcd.supabase.co/functions/v1/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            user_id,
            username,
            first_name,
            last_name,
            ...(middle_name && { middle_name }),
            email_address,
            contact_number,
            status,
            password: default_password,
            role_ids: role_id,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          console.error(result);
          return toast.error(result.message || 'Error creating account');
        }

        toast.success('Account created!');
      }

      fetchAccounts();
      setShowModal(false);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error('Unexpected error');
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [
        'user_id',
        'username',
        'first_name',
        'last_name',
        'middle_name',
        'email_address',
        'contact_number',
        'status',
        'role_name',
      ],
      [
        '2022.....001',
        'JohnD',
        'John',
        'Doe',
        'A.',
        'john.doe@example.com',
        '09171234567',
        'Active',
        'Admin,Dean',
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ImportTemplate');
    XLSX.writeFile(wb, 'Accounts_Import_Template.xlsx');
  };

  const handleReactivateAccount = async (userId: string) => {
    const { error } = await supabase
      .from('tbl_users')
      .update({ status: 'Active' })
      .eq('user_id', userId);

    if (error) toast.error('Failed to reactivate account');
    else {
      toast.success('Account reactivated');
      fetchAccounts();
    }
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
        const {
          user_id,
          username,
          first_name,
          last_name,
          middle_name,
          email_address,
          contact_number,
          status,
          role_name,
        } = row;

        if (!user_id || !username || !first_name || !last_name || !email_address || !contact_number || !status || !role_name) {
          toast.error(`Missing fields for ${username || user_id}`);
          continue;
        }

        const roleNames = role_name.split(',').map((r: string) => r.trim());
        const roleIds = roleNames
          .map((rn: string) => roles.find((r) => r.role_name === rn)?.role_id)
          .filter((id: string | undefined): id is string => Boolean(id));

        if (roleIds.length === 0) {
          toast.error(`Invalid role(s) for ${username}`);
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
              user_id,
              username,
              first_name,
              last_name,
              ...(middle_name && { middle_name }),
              email_address,
              contact_number,
              status,
              password: default_password,
              role_ids: roleIds,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            console.error(result);
            toast.error(`Failed to create ${username}: ${result.message}`);
            continue;
          }

        } catch (err) {
          console.error(err);
          toast.error(`Unexpected error creating ${username}`);
          continue;
        }
      }

      toast.success('Import completed');
      fetchAccounts();
      setShowImport(false);
    };

    reader.readAsArrayBuffer(file);
  };


  const filtered = accounts.filter(u =>
    `${u.first_name} ${u.last_name} ${u.middle_name ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.username ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email_address ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.contact_number ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <button type="button"  className="action-button add-new" onClick={handleAddAccount}>Add New Account</button>
        <button type="button" className="action-button import" onClick={() => setShowImport(true)}>Import Accounts</button>
      </div>

      <div className="accounts-table-container">
        <table className="accounts-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8}>No user accounts found.</td></tr>
            ) : filtered.map(u => (
              <tr key={u.user_id}>
                <td>{u.user_id}</td>
                <td>{u.last_name}, {u.first_name} {u.middle_name ?? ''}</td>
                <td>{u.username}</td>
                <td>{u.email_address}</td>
                <td>{u.contact_number}</td>
                <td>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '8px',
                      backgroundColor:
                        u.status === 'Active' ? '#d4edda' :
                        u.status === 'Inactive' ? '#ffeeba' :
                        u.status === 'Suspended' ? '#f8d7da' :
                        '#e2e3e5',
                      color:
                        u.status === 'Suspended' ? '#721c24' :
                        u.status === 'Inactive' ? '#856404' :
                        u.status === 'Active' ? '#155724' :
                        '#383d41',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}
                  >
                    {u.status}
                  </span>
                </td>
                <td>{u.role}</td>
                <td className="action-buttons">
                  <button
                  type="button"
                  className="icon-button edit-button"
                  onClick={() => {
                    setNewAccount({
                      user_id: u.user_id,
                      username: u.username || '',
                      first_name: u.first_name,
                      last_name: u.last_name,
                      middle_name: u.middle_name || '',
                      email_address: u.email_address || '',
                      contact_number: u.contact_number || '',
                      status: u.status,
                      role_id: roles
                        .filter(r => u.role.includes(r.role_name)) // match roles by name
                        .map(r => r.role_id),
                    });
                    setIsEditing(true);
                    setShowModal(true);
                  }}
                >
                  <FaEdit />
                </button>


                  {u.status === 'Suspended' ? (
                    <button
                      type="button"
                      className="icon-button reactivate-button"
                      onClick={() => handleReactivateAccount(u.user_id)}
                      title="Reactivate Account"
                    >
                      🔁
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="icon-button delete-button"
                      onClick={() => handleArchive(u.user_id)}
                      title="Suspend Account"
                    >
                      <FaTrash />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <h4>Add New Account</h4>
              {['user_id', 'username', 'first_name', 'last_name', 'middle_name', 'email_address', 'contact_number'].map(k => (
                <input
                  key={k}
                  placeholder={k.replace('_', ' ').toUpperCase()}
                  value={(newAccount as any)[k]}
                  onChange={e => setNewAccount(prev => ({ ...prev, [k]: e.target.value }))}
                />
              ))}

              <select
                value={newAccount.status}
                onChange={e => setNewAccount(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <div className="checkbox-group">
                <label>Assign Roles:</label>
                {roles.map((r) => (
                  <div key={r.role_id}>
                    <input
                      type="checkbox"
                      id={`role-${r.role_id}`}
                      value={r.role_id}
                      checked={newAccount.role_id.includes(r.role_id)}
                      onChange={(e) => {
                        const selectedRoles = newAccount.role_id;
                        const updatedRoles = e.target.checked
                          ? [...selectedRoles, r.role_id]
                          : selectedRoles.filter((id) => id !== r.role_id);
                        setNewAccount((prev) => ({ ...prev, role_id: updatedRoles }));
                      }}
                    />
                    <label htmlFor={`role-${r.role_id}`}>{r.role_name}</label>
                  </div>
                ))}
              </div>


              <button type="button" onClick={handleSaveAccount}>Save</button>
              <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <h4>Import Accounts from Excel</h4>
              <button type="button" className="modal-button download" onClick={downloadTemplate}>Download Template</button>
              <input type="file" accept=".xlsx, .xls" onChange={handleImport} />
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowImport(false)}>Done</button>
                <button type="button" onClick={() => setShowImport(false)}>Cancel</button>
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
