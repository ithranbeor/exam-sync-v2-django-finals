// DashboardFaculty.tsx
// deno-lint-ignore-file jsx-button-has-type no-explicit-any
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.ts';
import {
  FaHome, FaCalendar, FaClock, FaClipboardList, FaBell, FaUser, FaSignOutAlt
} from 'react-icons/fa';
import '../styles/dashboardFaculty.css';

import Profile from '../components/Profile.tsx';
import ProctorExamDate from "./ProctorExamDate.tsx";
import ProctorSetAvailability from "./ProctorSetAvailability.tsx";
import ProctorViewExam from "./ProctorViewExam.tsx";
import Notification from "./Notification.tsx";


const iconStyle = { className: 'icon', size: 20 };

const DashboardFaculty = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
      const loadUser = async () => {
        const stored = JSON.parse(localStorage.getItem('user') || 'null') ||
                      JSON.parse(sessionStorage.getItem('user') || 'null');
        if (!stored) return navigate('/');
        
        const { data, error } = await supabase
          .from('tbl_users')
          .select('user_id, first_name, middle_name, last_name, avatar_url')
          .eq('user_id', stored.user_id)
          .single();
  
        if (!error && data) {
          setUser({ ...stored, avatar_url: data.avatar_url });
        } else {
          setUser(stored);
        }
      };
      loadUser();
    }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user?.first_name) return;
      const { data, error } = await supabase.rpc('get_user_roles_by_first_name', {
        input_first_name: user.first_name
      });
      if (!error) {
        setRoles(data.map((r: any) => r.role_name));
      }
    };
    fetchUserRoles();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/');
  };

  const timeString = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const [hour, minute, ampm] = timeString.split(/:| /);
  const dateStr = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  if (!user) return <div>Loading...</div>;

  return (
    <div className="app-container">
      <div className="main-content-wrapper">
        <aside
          className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
          onMouseEnter={() => setIsSidebarOpen(true)}
          onMouseLeave={() => setIsSidebarOpen(false)}
        >
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <img src="./src/assets/Exam.png" alt="Logo" className="logo-img" />
              {isSidebarOpen && <span className="logo-text">ExamSync</span>}
            </div>
          </div>
          <nav className="sidebar-nav">
            <ul>
              <li className={activeMenu === 'dashboard' ? 'active' : ''}>
                <button onClick={() => setActiveMenu('dashboard')}>
                  <FaHome {...iconStyle} />
                  {isSidebarOpen && <span>Dashboard</span>}
                </button>
              </li>
              <li className={activeMenu === 'exam-date' ? 'active' : ''}>
                <button onClick={() => setActiveMenu('exam-date')}>
                  <FaCalendar {...iconStyle} />
                  {isSidebarOpen && <span>Exam Date</span>}
                </button>
              </li>
              <li className={activeMenu === 'set-availability' ? 'active' : ''}>
                <button onClick={() => setActiveMenu('set-availability')}>
                  <FaClock {...iconStyle} />
                  {isSidebarOpen && <span>Set Availability</span>}
                </button>
              </li>
              <li className={activeMenu === 'view-exam-schedule' ? 'active' : ''}>
                <button onClick={() => setActiveMenu('view-exam-schedule')}>
                  <FaClipboardList {...iconStyle} />
                  {isSidebarOpen && <span>View Exam Schedule</span>}
                </button>
              </li>
              <li className={activeMenu === 'notification' ? 'active' : ''}>
                <button onClick={() => setActiveMenu('notification')}>
                  <FaBell {...iconStyle} />
                  {isSidebarOpen && <span>Notification</span>}
                </button>
              </li>
              <li className={activeMenu === 'profile' ? 'active' : ''}>
                <button onClick={() => setActiveMenu('profile')}>
                  <FaUser {...iconStyle} />
                  {isSidebarOpen && <span>Profile</span>}
                </button>
              </li>
              <li>
                <button onClick={handleLogout}>
                  <FaSignOutAlt {...iconStyle} />
                  {isSidebarOpen && <span>Logout</span>}
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="content-header">
            <h1>{activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1).replace('-', ' ')}</h1>
          </div>

          {activeMenu === 'dashboard' && (
            <div className="dashboard-grid">
              <div className="card welcome-card">
                <h3>
                  Welcome, <span className="robert-name">{user.first_name}!</span>
                </h3>
                <p>Organize your work and improve your performance here</p>
              </div>
              <div className="card datetime-card">
                <div className="date-display-simple">{dateStr}</div>
                <div className="time-display">
                  <span>{hour}:</span><span>{minute}</span><span className="ampm">{ampm}</span>
                </div>
              </div>
              <div className="card faculty-info-card">
                <img
                  src={user.avatar_url ?? './src/assets/default-pp.jpg'}
                  alt="Avatar"
                  className="faculty-avatar"
                />
                <h4>{user.first_name} {user.middle_name} {user.last_name}</h4>
                <p>{roles.length ? roles.join(', ') : 'Loading role(s)...'}</p>
              </div>
              <div className="full-width-section">
                <h2>Shortcut</h2>
                <div className="try-things-grid">
                  <div className="card try-thing-card"><ProctorExamDate/></div>
                  <div className="card try-thing-card"><ProctorViewExam/></div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'exam-date' && <ProctorExamDate/>}
          {activeMenu === 'profile' && <Profile user={user} />}
          {activeMenu === 'set-availability' && <ProctorSetAvailability user={user}/>}
          {activeMenu === 'view-exam-schedule' && <ProctorViewExam/>}
          {activeMenu === 'notification' && <div><Notification user={user}/></div>}
        </main>
      </div>
    </div>
  );
};

export default DashboardFaculty;