// deno-lint-ignore-file no-explicit-any
import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaSearch, FaDownload } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient.ts';
import { ToastContainer, toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/colleges.css';

interface Term {
  term_id: number;
  term_name: string;
}

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
}

interface Course {
  course_id: string;
  course_name: string;
  term_id: number;
  user_id: number;
  term_name?: string;
  user_fullname?: string;
}

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_id: '',
    course_name: '',
    term_id: 0,
    user_id: 0,
  });
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchTerms();
    fetchUsers();
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('tbl_course')
      .select(`
        course_id, course_name, term_id, user_id,
        tbl_term (term_name),
        tbl_users (first_name, last_name)
      `);

    if (error) {
      toast.error('Failed to fetch courses');
    } else {
      const mapped = data.map((course: any) => ({
        ...course,
        term_name: course.tbl_term?.term_name,
        user_fullname: `${course.tbl_users?.first_name} ${course.tbl_users?.last_name}`,
      }));
      setCourses(mapped);
    }
  };

  const fetchTerms = async () => {
    const { data } = await supabase.from('tbl_term').select('*');
    if (data) setTerms(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('tbl_users').select('user_id, first_name, last_name');
    if (data) setUsers(data);
  };

  const handleSubmit = async () => {
    const { course_id, course_name, term_id, user_id } = newCourse;
    if (!course_id || !course_name || !term_id || !user_id) {
      toast.error('All fields are required.');
      return;
    }

    setIsSubmitting(true);

    if (editMode) {
      const { error } = await supabase
        .from('tbl_course')
        .update({ course_name, term_id, user_id })
        .eq('course_id', course_id);
      if (error) toast.error('Failed to update course');
      else toast.success('Course updated');
    } else {
      const { error } = await supabase.from('tbl_course').insert([{ course_id, course_name, term_id, user_id }]);
      if (error) toast.error('Failed to add course');
      else toast.success('Course added');
    }

    fetchCourses();
    setShowModal(false);
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tbl_course').delete().eq('course_id', id);
    if (error) toast.error('Failed to delete course');
    else {
      toast.success('Course deleted');
      fetchCourses();
    }
  };

  const filteredCourses = courses.filter(course =>
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.course_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Course ID', 'Course Name', 'Term Name', 'Instructor Full Name'],
      ['IT112', 'Computer Programming 1', '1st Semester', 'Ithran Beor Turno(No Middle Name)']
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Courses Template');
    XLSX.writeFile(workbook, 'courses_template.xlsx');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event: any) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;

      for (const row of json) {
        const course_id = row['Course ID']?.trim();
        const course_name = row['Course Name']?.trim();
        const term_name = row['Term Name']?.trim();
        const full_name = row['Instructor Full Name']?.trim();

        if (!course_id || !course_name || !term_name || !full_name) continue;

        const term = terms.find(t => t.term_name === term_name);
        const user = users.find(u => `${u.first_name} ${u.last_name}` === full_name);

        if (!term || !user) continue;

        const { error } = await supabase.from('tbl_course').insert([
          {
            course_id,
            course_name,
            term_id: term.term_id,
            user_id: user.user_id,
          },
        ]);

        if (!error) successCount++;
      }

      toast.success(`Import completed: ${successCount} added`);
      fetchCourses();
      setShowImport(false);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="colleges-container">
      <div className="colleges-header">
        <h2 className="colleges-title">Manage Courses</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search Course Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="button" className="search-button"><FaSearch /></button>
        </div>
      </div>

      <div className="colleges-actions">
        <button type="button" className="action-button add-new" onClick={() => {
          setNewCourse({ course_id: '', course_name: '', term_id: 0, user_id: 0 });
          setEditMode(false);
          setShowModal(true);
        }}>
          Add New Course
        </button>
        <button type="button" className="action-button import" onClick={() => setShowImport(true)}>
          Import Courses
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
              <th>Course ID</th>
              <th>Course Name</th>
              <th>Term</th>
              <th>Instructor</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((course, index) => (
              <tr key={course.course_id}>
                <td>{index + 1}</td>
                <td>{course.course_id}</td>
                <td>{course.course_name}</td>
                <td>{course.term_name}</td>
                <td>{course.user_fullname}</td>
                <td className="action-buttons">
                  <button type='button' className="icon-button edit-button" onClick={() => {
                    setNewCourse(course);
                    setEditMode(true);
                    setShowModal(true);
                  }}>
                    <FaEdit />
                  </button>
                  <button type='button' className="icon-button delete-button" onClick={() => handleDelete(course.course_id)}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {filteredCourses.length === 0 && (
              <tr><td colSpan={6}>No courses found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ textAlign: 'center' }}>{editMode ? 'Edit Course' : 'Add New Course'}</h3>
            <div className="input-group">
              <label>Course ID</label>
              <input type="text" value={newCourse.course_id} disabled={editMode}
                     onChange={(e) => setNewCourse({ ...newCourse, course_id: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Course Name</label>
              <input type="text" value={newCourse.course_name}
                     onChange={(e) => setNewCourse({ ...newCourse, course_name: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Term</label>
              <select value={newCourse.term_id}
                      onChange={(e) => setNewCourse({ ...newCourse, term_id: parseInt(e.target.value) })}>
                <option value="">Select Term</option>
                {terms.map(term => (
                  <option key={term.term_id} value={term.term_id}>{term.term_name}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Instructor</label>
              <select value={newCourse.user_id}
                      onChange={(e) => setNewCourse({ ...newCourse, user_id: parseInt(e.target.value) })}>
                <option value="">Select Instructor</option>
                {users.map(user => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ textAlign: 'center' }}>Import Courses</h3>
            <input type="file" accept=".xlsx, .xls" onChange={handleImportFile} />
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

export default Courses;
