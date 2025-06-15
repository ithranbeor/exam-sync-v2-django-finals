import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaSearch } from 'react-icons/fa';
import '../styles/Department.css'; // Ensure this CSS file exists and is styled for departments

interface Department {
  id: number;
  name: string;
  description: string;
  collegeName?: string; // Added to support the 'College' column
}

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Example of fetching data. Uncomment and modify for your actual data source (e.g., Supabase)
  useEffect(() => {
    // In a real application, you'd fetch data here.
    // For demonstration, let's populate with some dummy data.

    // If using Supabase, it would look something like this:
    /*
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments') // Make sure your table name is 'departments'
        .select('*');

      if (error) {
        console.error('Error fetching departments:', error.message);
      } else {
        setDepartments(data || []);
      }
    };
    fetchDepartments();
    */
  }, []); // Empty dependency array means this effect runs once on mount

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleAddDepartment = () => {
    console.log('Add New Department clicked');
    // Implement logic to add a new department (e.g., open a modal/form)
  };

  const handleImportDepartments = () => {
    console.log('Import Departments clicked');
    // Implement logic for importing departments
  };

  const handleDelete = (id: number) => {
    console.log('Delete department with ID:', id);
    // In a real app, you'd make an API call to delete the department from the database
    setDepartments(departments.filter(department => department.id !== id));
  };

  const handleEdit = (id: number) => {
    console.log('Edit department with ID:', id);
    // Implement logic to edit a department (e.g., open a modal/form with pre-filled data)
  };

  const handleSaveChanges = () => {
    console.log('Save Changes clicked');
    // This button typically implies changes made in the table itself need saving.
    // Given the current setup, this might be redundant if edit/delete operations
    // are immediately updating state/database. Consider its purpose.
  };

  // Filter departments based on search term (case-insensitive name or description)
  const filteredDepartments = departments.filter(department =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (department.collegeName && department.collegeName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="departments-container"> {/* Changed class name */}
      <div className="departments-header"> {/* Changed class name */}
        <h2 className="departments-title">Manage Departments</h2> {/* Changed title */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for Departments"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button type="button" className="search-button"><FaSearch /></button>
        </div>
      </div>

      <div className="departments-actions"> {/* Changed class name */}
        <button className="action-button add-new" onClick={handleAddDepartment}> {/* Changed function name */}
          Add New Department
        </button>
        <button className="action-button import" onClick={handleImportDepartments}>
          Import Departments
        </button>
      </div>

      <div className="departments-table-container"> {/* Changed class name */}
        <table className="departments-table"> {/* Changed class name */}
          <thead>
            <tr>
              <th>#</th>
              <th>Department Name</th> {/* Changed column header */}
              <th>Description</th>
              <th>College</th> {/* Added College column */}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-data-message">No departments found.</td> {/* Changed colSpan */}
              </tr>
            ) : (
              filteredDepartments.map((department, index) => (
                <tr key={department.id}>
                  <td>{index + 1}</td>
                  <td>{department.name}</td>
                  <td>{department.description || 'N/A'}</td>
                  <td>{department.collegeName || 'N/A'}</td> {/* Display college name */}
                  <td className="action-buttons">
                    <button className="icon-button delete-button" onClick={() => handleDelete(department.id)}>
                      <FaTrash />
                    </button>
                    <button className="icon-button edit-button" onClick={() => handleEdit(department.id)}>
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="save-changes-footer">
        <button className="action-button save-changes" onClick={handleSaveChanges}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default Departments;