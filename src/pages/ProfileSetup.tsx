import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { UserFormData } from '../types';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { createUser } = useApp();
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    displayName: '',
    email: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateUsername = (username: string): string | null => {
    if (username.length < 3 || username.length > 50) {
      return 'Username must be 3-50 characters';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Username must contain only letters, numbers, underscores, and hyphens';
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate
    const usernameError = validateUsername(formData.username);
    if (usernameError) {
      setErrors(prev => ({ ...prev, username: usernameError }));
      setIsSubmitting(false);
      return;
    }

    if (formData.email && !validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      setIsSubmitting(false);
      return;
    }

    try {
      await createUser(formData);
      navigate('/explore');
    } catch (error: any) {
      if (error.message.includes('username')) {
        setErrors(prev => ({ ...prev, username: error.message }));
      } else if (error.message.includes('email')) {
        setErrors(prev => ({ ...prev, email: error.message }));
      } else {
        setErrors(prev => ({ ...prev, general: error.message || 'Failed to create profile' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
        <h1 style={{ marginBottom: '24px', textAlign: 'center' }}>Create Your Profile</h1>
        <p style={{ marginBottom: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Get started by creating your profile to manage your book collection.
        </p>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Username <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
              required
              style={{ width: '100%' }}
              placeholder="booklover123"
            />
            {errors.username && <div className="error-message">{errors.username}</div>}
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              3-50 characters, letters, numbers, underscores, and hyphens only
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="displayName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              style={{ width: '100%' }}
              placeholder="Alex Reader"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              style={{ width: '100%' }}
              placeholder="alex@example.com"
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%' }}
          >
            {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

