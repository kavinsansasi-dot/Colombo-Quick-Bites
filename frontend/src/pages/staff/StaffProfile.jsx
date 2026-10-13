import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { authApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  postalCode: '',
  password: '',
};

const getApiErrorMessage = (error) => {
  const validationErrors = error?.response?.data?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length) {
    return validationErrors.map((item) => item.msg).join(', ');
  }
  return error?.response?.data?.message || 'Request failed';
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const StaffProfile = () => {
  const queryClient = useQueryClient();
  const { user: authUser, updateUser } = useAuth();

  const [formData, setFormData] = useState(EMPTY_FORM);

  const {
    data: profileResponse,
    isLoading,
    error,
  } = useQuery('staffProfileDetails', () => authApi.getMe(), {
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const user = profileResponse?.user || authUser;
    if (!user) return;

    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      postalCode: user.address?.postalCode || '',
      password: '',
    });
  }, [profileResponse, authUser]);

  const updateProfileMutation = useMutation((payload) => authApi.updateMe(payload), {
    onSuccess: (response) => {
      const updatedUser = response?.user;
      if (updatedUser) {
        updateUser(updatedUser);
      }
      queryClient.invalidateQueries('staffProfileDetails');
      toast.success('Profile updated successfully');
      setFormData((prev) => ({ ...prev, password: '' }));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }

    const payload = {
      name,
      email,
      phone: formData.phone.trim(),
      address: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
      },
    };

    const password = formData.password.trim();
    if (password) {
      payload.password = password;
    }

    updateProfileMutation.mutate(payload);
  };

  const currentUser = profileResponse?.user || authUser;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Staff Profile</h1>
        <p className="text-gray-600 mb-8">Manage your account details</p>
        <div className="animate-pulse rounded-xl bg-gray-200 h-72" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Staff Profile</h1>
        <p className="text-gray-600">Manage your account details</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load profile details. Please refresh.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  minLength={8}
                  placeholder="Leave empty to keep current password"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                  Street
                </label>
                <input
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="btn-primary disabled:opacity-50"
                disabled={updateProfileMutation.isLoading}
              >
                {updateProfileMutation.isLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">Account Summary</h2>
          <div className="text-sm space-y-2">
            <p className="flex items-center justify-between">
              <span className="text-gray-600">Role</span>
              <span className="font-medium capitalize">{currentUser?.role || 'staff'}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-600">User ID</span>
              <span className="font-mono text-xs">{(currentUser?._id || currentUser?.id || 'N/A').toString().slice(-8)}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-600">Created</span>
              <span className="font-medium text-right">{formatDate(currentUser?.createdAt)}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-600">Updated</span>
              <span className="font-medium text-right">{formatDate(currentUser?.updatedAt)}</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StaffProfile;
