import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { updateUser, getUserBookCount, getUserSeriesCount } from '../db/database';
import type { UserUpdateData } from '../types';

export default function Profile() {
  const { user, refreshUser } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserUpdateData>({
    displayName: user?.displayName || '',
    email: user?.email || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookCount, setBookCount] = useState(0);
  const [seriesCount, setSeriesCount] = useState(0);

  useEffect(() => {
    if (user) {
      setBookCount(getUserBookCount(user.id));
      setSeriesCount(getUserSeriesCount(user.id));
    }
  }, [user]);

  // Sync formData with user when entering edit mode
  useEffect(() => {
    if (user && isEditing) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || ''
      });
    }
  }, [user, isEditing]);

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (formData.email && !validateEmail(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    try {
      updateUser(user.id, formData);
      await refreshUser();
      setIsEditing(false);
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to update profile' });
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Profile</h1>
        {!isEditing && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      <div className="card">
        {errors.general && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee',
            color: '#dc3545',
            borderRadius: 'var(--border-radius)',
            marginBottom: '20px'
          }}>
            {errors.general}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Username</label>
          <input
            type="text"
            value={user.username}
            disabled
            style={{ width: '100%', backgroundColor: 'var(--background-light)', cursor: 'not-allowed' }}
          />
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Username cannot be changed
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Display Name</label>
          {isEditing ? (
            <>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </>
          ) : (
            <div style={{ padding: '10px', backgroundColor: 'var(--background-light)', borderRadius: 'var(--border-radius)' }}>
              {user.displayName || 'Not set'}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
          {isEditing ? (
            <>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                style={{ width: '100%' }}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </>
          ) : (
            <div style={{ padding: '10px', backgroundColor: 'var(--background-light)', borderRadius: 'var(--border-radius)' }}>
              {user.email || 'Not set'}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--background-light)', borderRadius: 'var(--border-radius)' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {bookCount}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Books</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {seriesCount}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Series</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </div>

        {isEditing && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Changes
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  displayName: user.displayName || '',
                  email: user.email || ''
                });
                setErrors({});
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

