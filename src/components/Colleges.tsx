import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaSearch } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/colleges.css';

interface College {
  college_id: number;
  name: string;
  dean_name?: string;
}

interface User {
  user_id: string;
}

interface Dean {
  user_id: number;
  full_name: string;
}

interface CollegesProps {
  user: User;
}

const Colleges: React.FC<CollegesProps> = ({ user }) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [selectedDeanId, setSelectedDeanId] = useState<number | null>(null);
  const [deans, setDeans] = useState<Dean[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingCollegeId, setEditingCollegeId] = useState<number | null>(null);

  useEffect(() => {
    const fetchColleges = async () => {
      const { data, error } = await supabase
        .from('tbl_college')
        .select(`
          college_id,
          college_name,
          dean:tbl_users(first_name, last_name)
        `);

      if (error) {
        console.error('Error fetching colleges:', error.message);
      } else {
        const formatted = data.map((item: any) => ({
          college_id: item.college_id,
          name: item.college_name,
          dean_name: item.dean ? `${item.dean.first_name} ${item.dean.last_name}` : 'N/A',
        }));
        setColleges(formatted);
      }
    };

    const fetchDeans = async () => {
      const { data, error } = await supabase
        .from('tbl_user_roles')
        .select(`
          user_id,
          tbl_users(first_name, last_name)
        `)
        .eq('role_id', 1); // Assuming 1 = Dean

      if (error) {
        console.error('Error fetching deans:', error.message);
      } else {
        const formatted = data.map((item: any) => ({
          user_id: item.user_id,
          full_name: `${item.tbl_users.first_name} ${item.tbl_users.last_name}`,
        }));
        setDeans(formatted);
      }
    };

    fetchColleges();
    fetchDeans();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddCollege = () => {
    setNewCollegeName('');
    setSelectedDeanId(null);
    setEditMode(false);
    setEditingCollegeId(null);
    setShowModal(true);
  };

  const handleModalSubmit = async () => {
    if (!newCollegeName.trim() || selectedDeanId === null) {
      toast.error('Please provide a college name and select a dean.');
      return;
    }

    if (editMode && editingCollegeId !== null) {
      const { error } = await supabase
        .from('tbl_college')
        .update({
          college_name: newCollegeName,
          user_id: selectedDeanId,
        })
        .eq('college_id', editingCollegeId);

      if (error) {
        console.error('Error updating college:', error.message);
        toast.error('Failed to update college.');
      } else {
        toast.success('College updated successfully!');
        setColleges(colleges.map((college) =>
          college.college_id === editingCollegeId
            ? {
                ...college,
                name: newCollegeName,
                dean_name: deans.find((d) => d.user_id === selectedDeanId)?.full_name || 'N/A',
              }
            : college
        ));
      }
    } else {
      const { data, error } = await supabase
        .from('tbl_college')
        .insert([
          {
            college_name: newCollegeName,
            user_id: selectedDeanId,
          },
        ])
        .select(`
          college_id,
          college_name,
          tbl_users(first_name, last_name)
        `)
        .single();

      if (error) {
        console.error('Error adding college:', error.message);
        toast.error('Failed to add college.');
      } else {
        const dean = deans.find((d) => d.user_id === selectedDeanId);
        const newCollege: College = {
          college_id: data.college_id,
          name: data.college_name,
          dean_name: dean ? dean.full_name : 'N/A',
        };
        setColleges((prev) => [...prev, newCollege]);
        toast.success('College added successfully!');
      }
    }

    setShowModal(false);
    setNewCollegeName('');
    setSelectedDeanId(null);
    setEditMode(false);
    setEditingCollegeId(null);
  };


  const handleDelete = async (id: number) => {
    const { error } = await supabase
      .from('tbl_college')
      .delete()
      .eq('college_id', id);

    if (error) {
      console.error('Error deleting college:', error.message);
      toast.error('Failed to delete college.');
    } else {
      setColleges(colleges.filter((college) => college.college_id !== id));
      toast.success('College deleted successfully!');
    }
  };

  const filteredColleges = colleges.filter((college) =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="colleges-container">
      <div className="colleges-header">
        <h2 className="colleges-title">Manage Colleges</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for Colleges"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button type="button" className="search-button">
            <FaSearch />
          </button>
        </div>
      </div>

      <div className="colleges-actions">
        <button className="action-button add-new" onClick={handleAddCollege}>
          Add New College
        </button>
        <button className="action-button import" onClick={() => setShowImport(true)}>
          Import Colleges
        </button>
      </div>

      <div className="colleges-table-container">
        <table className="colleges-table">
          <thead>
            <tr>
              <th>#</th>
              <th>College Name</th>
              <th>Dean</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredColleges.length === 0 ? (
              <tr>
                <td colSpan={4}>No colleges found.</td>
              </tr>
            ) : (
              filteredColleges.map((college, index) => (
                <tr key={college.college_id}>
                  <td>{index + 1}</td>
                  <td>{college.name}</td>
                  <td>{college.dean_name || 'N/A'}</td>
                  <td className="action-buttons">
                    <button className="icon-button delete-button" onClick={() => handleDelete(college.college_id)}>
                      <FaTrash />
                    </button>
                    <button className="icon-button edit-button" onClick={() => {
                      setNewCollegeName(college.name);
                      const dean = deans.find(d => d.full_name === college.dean_name);
                      setSelectedDeanId(dean?.user_id ?? null);
                      setEditingCollegeId(college.college_id);
                      setEditMode(true);
                      setShowModal(true);
                    }}>
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editMode ? 'Edit College' : 'Add New College'}</h3>
            <input
              type="text"
              placeholder="College Name"
              value={newCollegeName}
              onChange={(e) => setNewCollegeName(e.target.value)}
            />
            <select
              value={selectedDeanId ?? ''}
              onChange={(e) => setSelectedDeanId(Number(e.target.value))}
            >
              <option value="">Select Dean</option>
              {deans.map((dean) => (
                <option key={dean.user_id} value={dean.user_id}>
                  {dean.full_name}
                </option>
              ))}
            </select>
            <div className="modal-actions">
              <button className="modal-button save" onClick={handleModalSubmit}>
                Save
              </button>
              <button
                className="modal-button cancel"
                onClick={() => {
                  setShowModal(false);
                  setEditMode(false);
                  setNewCollegeName('');
                  setSelectedDeanId(null);
                  setEditingCollegeId(null);
                }}
              >
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
            <h3>Import Colleges from Excel</h3>
            <input type="file" accept=".xlsx, .xls" />
            <div className="modal-actions">
              <button className="modal-button save" onClick={() => setShowImport(false)}>
                Done
              </button>
              <button className="modal-button cancel" onClick={() => setShowImport(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
};

export default Colleges;
