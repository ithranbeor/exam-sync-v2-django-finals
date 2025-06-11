import { useState, useEffect } from 'react';
import {
  FaHome,
  FaClock,
  FaCalendar,
  FaClipboardList,
  FaBell,
  FaUser,
  FaSignOutAlt,
  
} from 'react-icons/fa';
import '../styles/dashboardFaculty.css';

const iconStyle = { className: 'icon', size: 20 };

const DashboardFaculty = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const getMonthName = (date: Date) =>
    date.toLocaleString('en-US', { month: 'long' });

  const getDayOfWeekName = (date: Date) =>
    date.toLocaleString('en-US', { weekday: 'long' });

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const [hour, minute, ampm] = formattedTime.split(/:| /);
  const currentMonthName = getMonthName(currentDateTime);
  const currentDay = currentDateTime.getDate();
  const currentDayOfWeek = getDayOfWeekName(currentDateTime);

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
              <li>
                <a href="#dashboard">
                  <FaHome {...iconStyle} />
                  {isSidebarOpen && <span>Dashboard</span>}
                </a>
              </li>
              <li>
                <a href="#exam-date">
                  <FaCalendar {...iconStyle} />
                  {isSidebarOpen && <span>Exam Date</span>}
                </a>
              </li>
              <li>
                <a href="#set-availability">
                  <FaClock {...iconStyle} />
                  {isSidebarOpen && <span>Set Availability</span>}
                </a>
              </li>
              <li>
                <a href="#view-exam-schedule">
                  <FaClipboardList {...iconStyle} />
                  {isSidebarOpen && <span>View Exam Schedule</span>}
                </a>
              </li>
              <li>
                <a href="#notification">
                  <FaBell {...iconStyle} />
                  {isSidebarOpen && <span>Notification</span>}
                </a>
              </li>
              <li>
                <a href="#profile">
                  <FaUser {...iconStyle} />
                  {isSidebarOpen && <span>Profile</span>}
                </a>
              </li>
            </ul>
          </nav>

          <div className="sidebar-footer">
            <a href="#logout">
              <FaSignOutAlt {...iconStyle} />
              {isSidebarOpen && <span>Logout</span>}
            </a>
          </div>
        </aside>

        <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="content-header">
            <h1>Home</h1>
          </div>

          <div className="dashboard-grid">
            <div className="card welcome-card">
              <h3>
                Welcome, <span className="robert-name">Robert!</span>
              </h3>
              <p>Organize your work and improve your performance here</p>
            </div>

            <div className="card datetime-card">
              <div className="date-display-simple">
                <span>{currentMonthName} {currentDay}, {currentDayOfWeek}</span>
              </div>
              <div className="time-display">
                <span>{hour}:</span>
                <span>{minute}</span>
                <span className="ampm">{ampm}</span>
              </div>
            </div>

            <div className="card faculty-info-card">
              <img
                src="./src/assets/ba.png" 
                alt="Robert C. Nordan"
                className="faculty-avatar"
              />
              <h4>Robert C. Nordan</h4>
              <p>Faculty-in-charge</p>
            </div>

            <div className="full-width-section">
              <h2>Try these things out</h2>
              <div className="try-things-grid">
                <div className="card try-thing-card">
                  <img
                    src="./src/assets/ba.png"
                    alt="Set Availability"
                    className="try-thing-img"
                  />
                  <p>Try Setting Your Availability</p>
                  <button className="set-button">Set</button>
                </div>

                <div className="card try-thing-card">
                  <img
                    src="./src/assets/ba.png"
                    alt="View Exam Schedule"
                    className="try-thing-img"
                  />
                  <p>View Exam Schedule</p>
                  <button className="view-button">View</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardFaculty;  