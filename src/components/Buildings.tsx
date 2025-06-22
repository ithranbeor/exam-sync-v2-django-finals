// deno-lint-ignore-file no-explicit-any
import React, { useEffect, useState } from 'react';
import { FaSearch, FaTrash, FaEdit, FaDownload } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient.ts';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/colleges.css';

interface Building {
  building_id: string;
  building_name: string;
}

const Buildings: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newBuilding, setNewBuilding] = useState<Building>({
    building_id: '',
    building_name: '',
  });

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    const { data, error } = await supabase.from('tbl_buildings').select('*');
    if (error) toast.error('Failed to fetch buildings');
    else setBuildings(data || []);
  };

  const handleSubmit = async () => {
    const { building_id, building_name } = newBuilding;
    if (!building_id || !building_name) {
      toast.error('All fields are required');
      return;
    }

    const { error } = editMode
      ? await supabase
          .from('tbl_buildings')
          .update({ building_name })
          .eq('building_id', building_id)
      : await supabase.from('tbl_buildings').insert([newBuilding]);

    toast[error ? 'error' : 'success'](
      error ? 'Failed to save building' : editMode ? 'Building updated' : 'Building added'
    );

    setShowModal(false);
    setNewBuilding({ building_id: '', building_name: '' });
    fetchBuildings();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('tbl_buildings')
      .delete()
      .eq('building_id', id);
    toast[error ? 'error' : 'success'](
      error ? 'Failed to delete building' : 'Building deleted'
    );
    fetchBuildings();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt: any) => {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      let added = 0;
      for (const row of rows) {
        const building_id = row['Building ID']?.trim();
        const building_name = row['Building Name']?.trim();
        if (!building_id || !building_name) continue;

        const { error } = await supabase
          .from('tbl_buildings')
          .insert([{ building_id, building_name }]);

        if (!error) added++;
      }

      toast.success(`Import completed: ${added} building(s) added`);
      fetchBuildings();
      setShowImport(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Building ID', 'Building Name'],
      ['B101', 'Main Building'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Buildings Template');
    XLSX.writeFile(wb, 'buildings_template.xlsx');
  };

  const filtered = buildings.filter((b) =>
    b.building_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="colleges-container">
      <div className="colleges-header">
        <h2 className="colleges-title">Manage Buildings</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search Building Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="button" className="search-button"><FaSearch /></button>
        </div>
      </div>

      <div className="colleges-actions">
        <button type="button" className="action-button add-new" onClick={() => {
          setEditMode(false);
          setNewBuilding({ building_id: '', building_name: '' });
          setShowModal(true);
        }}>
          Add New Building
        </button>
        <button type="button" className="action-button import" onClick={() => setShowImport(true)}>
          Import Buildings
        </button>
        <button type="button" className="action-button download" onClick={downloadTemplate}>
          <FaDownload style={{ marginRight: 5 }} /> Download Template
        </button>
      </div>

      <div className="colleges-table-container">
        <table className="colleges-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Building ID</th>
              <th>Building Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, index) => (
              <tr key={b.building_id}>
                <td>{index + 1}</td>
                <td>{b.building_id}</td>
                <td>{b.building_name}</td>
                <td className="action-buttons">
                  <button
                    type="button"
                    className="icon-button edit-button"
                    onClick={() => {
                      setEditMode(true);
                      setNewBuilding(b);
                      setShowModal(true);
                    }}
                  ><FaEdit /></button>
                  <button
                    type="button"
                    className="icon-button delete-button"
                    onClick={() => handleDelete(b.building_id)}
                  ><FaTrash /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4}>No buildings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ textAlign: 'center' }}>{editMode ? 'Edit Building' : 'Add New Building'}</h3>
            <div className="input-group">
              <label>Building ID</label>
              <input
                type="text"
                disabled={editMode}
                value={newBuilding.building_id}
                onChange={(e) =>
                  setNewBuilding({ ...newBuilding, building_id: e.target.value })
                }
              />
            </div>
            <div className="input-group">
              <label>Building Name</label>
              <input
                type="text"
                value={newBuilding.building_name}
                onChange={(e) =>
                  setNewBuilding({ ...newBuilding, building_name: e.target.value })
                }
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={handleSubmit}>
                Save
              </button>
              <button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ textAlign: 'center' }}>Import Buildings</h3>
            <input type="file" accept=".xlsx,.xls" onChange={handleImportFile} />
            <div className="modal-actions">
              <button type="button" onClick={() => setShowImport(false)}>Done</button>
              <button type="button" onClick={() => setShowImport(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Buildings;
