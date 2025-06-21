// deno-lint-ignore-file no-explicit-any jsx-boolean-value
// src/components/Profile.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import '../styles/profile.css';
import { MdEdit } from 'react-icons/md';

interface UserProfile {
  user_id: number;
  first_name: string;
  last_name: string;
  middle_name: string;
  email_address: string;
  contact_number: string;
  avatar_url: string | null;
}

interface UserRoleInfo {
  role_name: string;
  college_name: string | null;
  department_name: string | null;
}

interface ProfileProps {
  user: {
    user_id: string;
    email: string; 

  } | null;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [profile, setProfile] = useState<UserProfile>({
    user_id: 0,
    first_name: '',
    last_name: '',
    middle_name: '',
    email_address: '',
    contact_number: '',
    avatar_url: null,
  });

  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);

  const [editingPersonalDetails, setEditingPersonalDetails] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleInfo[]>([]);

  const fetchProfile = useCallback(async () => {
    if (!user?.user_id) {
      setLoading(false);
      setError('User not logged in.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: fetchError } = await supabase
        .from('tbl_users')
        .select('*')
        .eq('user_id', user.user_id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (userData) {
        const fetchedProfile: UserProfile = {
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          middle_name: userData.middle_name || '',
          email_address: userData.email_address || user.email || '', 
          contact_number: userData.contact_number || '',
          avatar_url: userData.avatar_url || null,
          user_id: userData.user_id || 0,
        };
        setProfile(fetchedProfile);
        setOriginalProfile(fetchedProfile); 
        setPreview(fetchedProfile.avatar_url || null);
      }
    } catch (err: any) {
      console.error('Error loading profile:', err.message);
      setError('Failed to load profile. ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.user_id) {
      setError('No file selected or user not logged in.');
      return;
    }

    setError(null);

    try {
      if (profile.avatar_url) {

        const urlParts = profile.avatar_url.split('/avatars/');
        if (urlParts.length === 2) {
          const _path = `avatars/${urlParts[1]}`;
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([urlParts[1]]);
          if (deleteError) {
            console.warn('Could not delete old avatar:', deleteError.message);
          }
        }
      }

      const ext = file.name.split('.').pop();
      const filePath = `${user.user_id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true, 
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error('Could not get avatar URL');

      const { error: dbError } = await supabase
        .from('tbl_users')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', user.user_id);

      if (dbError) throw dbError;

      setProfile((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
      setPreview(urlData.publicUrl);
    } catch (err: any) {
      console.error('Avatar upload error:', err.message);
      setError('Failed to upload avatar. ' + err.message);
    }
  };

  const fetchUserRoles = useCallback(async () => {
    if (!user?.user_id) return;

    const { data, error } = await supabase
      .from('tbl_user_role')
      .select(`
        role_id,
        tbl_roles(role_name),
        tbl_college(college_name),
        tbl_department(department_name)
      `)
      .eq('user_id', user.user_id);

    if (error) {
      console.error('Error fetching user roles:', error.message);
      return;
    }

    const mappedRoles: UserRoleInfo[] = (data || []).map((role: any) => ({
      role_name: role.tbl_roles?.role_name || 'Unknown Role',
      college_name: role.tbl_college?.college_name || null,
      department_name: role.tbl_department?.department_name || null,
    }));

    setUserRoles(mappedRoles);
  }, [user]);

  useEffect(() => {
    fetchProfile();
    fetchUserRoles();
  }, [fetchProfile, fetchUserRoles]);

  const handleSaveChanges = async () => {
    if (!user?.user_id) {
      setError('User not logged in. Cannot save profile.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatePayload = {
        first_name: profile.first_name,
        middle_name: profile.middle_name,
        last_name: profile.last_name,
        email_address: profile.email_address,
        contact_number: profile.contact_number,
        avatar_url: profile.avatar_url,
      };

      const { error: updateError } = await supabase
        .from('tbl_users')
        .update(updatePayload)
        .eq('user_id', profile.user_id);

      if (updateError) {
        throw updateError;
      }

      setEditingPersonalDetails(false);
      await fetchProfile();
    } catch (err: any) {
      console.error('Error saving profile:', err.message);
      setError('Failed to save profile. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (originalProfile) {
      setProfile(originalProfile);
      setPreview(originalProfile.avatar_url);
    }
    setEditingPersonalDetails(false);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card loading-state">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header-title">
        Profile Details
      </div>

      {error && <div className="error-message-banner">{error}</div>}

      <div className="profile-section profile-info-card">
        <div className="profile-avatar-wrapper">
          <img
            src={preview || './src/assets/default-pp.jpg'}
            alt="Profile Avatar"
            className="profile-avatar"
          />
          {editingPersonalDetails && (
            <label htmlFor="avatar-upload" className="profile-avatar-edit-icon">
              <MdEdit size={24} />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
        <div className="profile-name-details">
          <div className="profile-full-name">
            {profile.first_name} {profile.middle_name} {profile.last_name}
          </div>
          <div className="profile-user-type">
            {userRoles.length > 0 ? (
              userRoles.map((role, index) => (
                <div key={index} style={{ marginBottom: 2 }}>
                  <strong>{role.role_name}</strong>
                  {role.college_name && ` - ${role.college_name}`}
                  {role.department_name && ` / ${role.department_name}`}
                </div>
              ))
            ) : (
              <span>No roles assigned</span>
            )}
          </div>
        </div>
      </div>

      <div className="profile-section personal-details-card">
        <div className="personal-details-header">
          <h3>Personal Details</h3>
          {!editingPersonalDetails && (
            <button type='button' className="edit-details-btn" onClick={() => setEditingPersonalDetails(true)} disabled={loading}>
              <MdEdit />
            </button>
          )}
        </div>

        <div className="personal-details-grid">
          {/* Row 1 */}
          <div className="profile-field-group">
            <label htmlFor="first_name">First Name</label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              value={profile.first_name}
              onChange={handleChange}
              disabled={!editingPersonalDetails || loading}
            />
          </div>
          <div className="profile-field-group">
            <label htmlFor="middle_name">M.I.</label>
            <input
              id="middle_name"
              name="middle_name"
              type="text"
              value={profile.middle_name}
              onChange={handleChange}
              disabled={!editingPersonalDetails || loading}
            />
          </div>
          <div className="profile-field-group">
            <label htmlFor="last_name">Last Name</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              value={profile.last_name}
              onChange={handleChange}
              disabled={!editingPersonalDetails || loading}
            />
          </div>

          {/* Row 2 */}
          <div className="profile-field-group">
            <label htmlFor="id">User ID</label>
            <input
              id="id"
              name="id"
              type="text"
              value={profile.user_id}
              disabled={true}
            />
          </div>
          <div className="profile-field-group span-2-columns">
            <label htmlFor="email_address">Email Address</label>
            <input
              id="email_address"
              name="email_address"
              type="email"
              value={profile.email_address}
              onChange={handleChange}
              disabled={!editingPersonalDetails || loading}
            />
          </div>

          {/* Row 3 */}
          <div className="profile-field-group">
            <label htmlFor="contact_number">Contact No.</label>
            <input
              id="contact_number"
              name="contact_number"
              type="text"
              value={profile.contact_number}
              onChange={handleChange}
              disabled={!editingPersonalDetails || loading}
            />
          </div>
        </div>

        {editingPersonalDetails && (
          <div className="personal-details-actions">
            <button type="button" className="btn cancel-personal-details" onClick={handleCancelEdit} disabled={loading}>
              Cancel
            </button>
            <button type="button" className="btn save-personal-details" onClick={handleSaveChanges} disabled={loading}>
              Save
            </button>
          </div>
        )}
      </div>

      <div className="profile-section password-change-card">
        <button type="button" className="btn change-password-btn">Change password</button>
      </div>

      <div className="profile-global-actions">
        <button type='button' className="btn save-changes-global" onClick={handleSaveChanges} disabled={loading}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default Profile;