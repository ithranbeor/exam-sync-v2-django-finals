import React, { useEffect, useState } from 'react';
import '../styles/proctorSetAvailability.css'; // reuse the same styling
import { supabase } from '../lib/supabaseClient.ts';

type NotificationProps = {
  user: {
    user_id: number;
    [key: string]: unknown;
  };
};

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

const Notification: React.FC<NotificationProps> = ({ user }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, [user?.user_id]);

  const fetchNotifications = async () => {
    if (!user?.user_id) return;

    const { data, error } = await supabase
      .from('tbl_notifications')
      .select('*')
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch notifications:', error.message);
    } else {
      setNotifications(data);
    }
  };

  const markAsRead = async (id: number) => {
    await supabase
      .from('tbl_notifications')
      .update({ is_read: true })
      .eq('id', id);
    fetchNotifications();
  };

  return (
    <div className="set-availability-container">
      <div className="availability-sections">
        <div className="availability-card">
          <div className="card-header-set">Notifications</div>

          {notifications.length === 0 ? (
            <p className="no-notifications">No notifications yet.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
                >
                  <div className="notification-header">
                    <strong>{notif.title}</strong>
                    <span className="notif-date">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="notification-message">{notif.message}</p>
                  {!notif.is_read && (
                    <button type='button'
                      className="submit-button small"
                      onClick={() => markAsRead(notif.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;
