import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import {
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  PencilSquareIcon,
  TrashIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { orderApi, userApi, inventoryApi, feedbackApi, promotionApi, menuApi } from '../../utils/api';
import '../../styles/admin-dashboard.css';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const formatShortDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-LK', {
    month: 'short',
    day: 'numeric',
  });
};

const getApiErrorMessage = (error) => {
  const validationErrors = error?.response?.data?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length) {
    return validationErrors.map((item) => item.msg).join(', ');
  }
  return error?.response?.data?.message || 'Request failed';
};

const EMPTY_CREATE_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
};

const EMPTY_EDIT_FORM = {
  name: '',
  email: '',
  role: 'customer',
  phone: '',
  password: '',
};

const DUMMY_ORDER_STATUS_DATA = [
  { label: 'Pending', value: 12, color: 'bg-amber-500' },
  { label: 'Preparing', value: 9, color: 'bg-blue-500' },
  { label: 'Ready', value: 7, color: 'bg-indigo-500' },
  { label: 'Delivered', value: 21, color: 'bg-emerald-500' },
  { label: 'Cancelled', value: 3, color: 'bg-rose-500' },
];

const DUMMY_RECENT_ORDER_TREND_DATA = [
  { id: 'd1', label: 'Mar 21', total: 1200 },
  { id: 'd2', label: 'Mar 22', total: 1800 },
  { id: 'd3', label: 'Mar 23', total: 1500 },
  { id: 'd4', label: 'Mar 24', total: 2200 },
  { id: 'd5', label: 'Mar 25', total: 2600 },
];

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [roleFilterInput, setRoleFilterInput] = useState('');
  const [userFilters, setUserFilters] = useState({ search: '', role: '' });

  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [editingUserId, setEditingUserId] = useState('');
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);

  const {
    data: dashboardResponse,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useQuery('adminDashboardStats', () => orderApi.getDashboardStats(), {
    refetchOnWindowFocus: false,
    refetchInterval: 30000,
  });

  const {
    data: usersSummaryResponse,
    isLoading: isUsersSummaryLoading,
    error: usersSummaryError,
  } = useQuery('adminUsersSummary', () => userApi.getUsers({ page: 1, limit: 1 }), {
    refetchOnWindowFocus: false,
    refetchInterval: 60000,
  });

  const {
    data: usersResponse,
    isLoading: isUsersLoading,
    error: usersError,
  } = useQuery(
    ['adminUsersCrud', userFilters.search, userFilters.role],
    () =>
      userApi.getUsers({
        page: 1,
        limit: 100,
        ...(userFilters.search ? { search: userFilters.search } : {}),
        ...(userFilters.role ? { role: userFilters.role } : {}),
      }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchInterval: 60000,
    }
  );

  const {
    data: inventoryAlertsResponse,
    isLoading: isInventoryLoading,
    error: inventoryError,
  } = useQuery('adminLowStockAlerts', () => inventoryApi.getLowStockAlerts(), {
    refetchOnWindowFocus: false,
    refetchInterval: 60000,
  });

  const {
    data: feedbackStatsResponse,
    isLoading: isFeedbackLoading,
    error: feedbackError,
  } = useQuery('adminFeedbackStats', () => feedbackApi.getFeedbackStats(), {
    refetchOnWindowFocus: false,
    refetchInterval: 60000,
  });

  const {
    data: promotionsResponse,
    isLoading: isPromotionsLoading,
    error: promotionsError,
  } = useQuery(
    'adminPromotionsSummary',
    () => promotionApi.getPromotions({ page: 1, limit: 20, isActive: true }),
    {
      refetchOnWindowFocus: false,
      refetchInterval: 60000,
    }
  );

  const {
    data: menuItemsResponse,
    isLoading: isMenuItemsLoading,
  } = useQuery(
    'adminMenuItemsSummary',
    () => menuApi.getMenuItems({ page: 1, limit: 8 }),
    {
      refetchOnWindowFocus: false,
      refetchInterval: 60000,
    }
  );

  const invalidateUserQueries = () => {
    queryClient.invalidateQueries('adminUsersSummary');
    queryClient.invalidateQueries(['adminUsersCrud']);
  };

  const createStaffMutation = useMutation((payload) => userApi.createStaff(payload), {
    onSuccess: () => {
      toast.success('Staff user created successfully');
      setCreateForm(EMPTY_CREATE_FORM);
      invalidateUserQueries();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const updateUserMutation = useMutation(
    ({ id, payload }) => userApi.updateUser(id, payload),
    {
      onSuccess: () => {
        toast.success('User updated successfully');
        setEditingUserId('');
        setEditForm(EMPTY_EDIT_FORM);
        invalidateUserQueries();
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    }
  );

  const deleteUserMutation = useMutation((id) => userApi.deleteUser(id), {
    onSuccess: () => {
      toast.success('User deleted successfully');
      invalidateUserQueries();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const isLoading =
    isDashboardLoading ||
    isUsersSummaryLoading ||
    isUsersLoading ||
    isInventoryLoading ||
    isFeedbackLoading ||
    isPromotionsLoading ||
    isMenuItemsLoading;

  useEffect(() => {
    if (location.hash !== '#user-crud' || isLoading) {
      return;
    }

    const userCrudSection = document.getElementById('user-crud');
    if (userCrudSection) {
      userCrudSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, isLoading]);

  const dataErrors = [
    dashboardError,
    usersSummaryError,
    usersError,
    inventoryError,
    feedbackError,
    promotionsError,
  ].filter(Boolean);

  const dashboardStats = dashboardResponse?.stats || {};
  const users = usersResponse?.users || [];
  const totalUsers = usersSummaryResponse?.pagination?.total || usersSummaryResponse?.users?.length || 0;

  const ordersByStatus = (dashboardStats.ordersByStatus || []).reduce((acc, current) => {
    acc[current._id] = current.count;
    return acc;
  }, {});

  const liveOrderStatusChartData = [
    { label: 'Pending', value: ordersByStatus.Pending || 0, color: 'bg-amber-500' },
    { label: 'Preparing', value: ordersByStatus.Preparing || 0, color: 'bg-blue-500' },
    { label: 'Ready', value: ordersByStatus.Ready || 0, color: 'bg-indigo-500' },
    { label: 'Delivered', value: ordersByStatus.Delivered || 0, color: 'bg-emerald-500' },
    { label: 'Cancelled', value: ordersByStatus.Cancelled || 0, color: 'bg-rose-500' },
  ];

  const hasLiveOrderStatusData = liveOrderStatusChartData.some((item) => item.value > 0);
  const orderStatusChartData = hasLiveOrderStatusData
    ? liveOrderStatusChartData
    : DUMMY_ORDER_STATUS_DATA;
  const totalOrdersInChart = orderStatusChartData.reduce((sum, item) => sum + item.value, 0);
  const maxOrderStatusCount = Math.max(...orderStatusChartData.map((item) => item.value), 1);

  const liveRecentOrderTrendData = (dashboardStats.recentOrders || [])
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((order) => ({
      id: order._id,
      label: formatShortDate(order.createdAt),
      total: order.total || 0,
    }));

  const recentOrderTrendData = liveRecentOrderTrendData.length
    ? liveRecentOrderTrendData
    : DUMMY_RECENT_ORDER_TREND_DATA;

  const maxRecentOrderTotal = Math.max(...recentOrderTrendData.map((item) => item.total), 1);

  const recentOrderTrendPoints = recentOrderTrendData.map((item, index) => {
    const x =
      recentOrderTrendData.length === 1
        ? 50
        : (index / (recentOrderTrendData.length - 1)) * 100;
    const y = 100 - (item.total / maxRecentOrderTotal) * 100;
    return {
      ...item,
      x,
      y,
    };
  });

  const recentOrderLinePoints = recentOrderTrendPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const recentOrderAreaPoints = recentOrderTrendPoints.length
    ? `0,100 ${recentOrderLinePoints} 100,100`
    : '';

  const statCards = [
    {
      title: 'Total Orders',
      value: dashboardStats.totalOrders || 0,
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Delivered Revenue',
      value: formatCurrency(dashboardStats.totalRevenue || 0),
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Pending Orders',
      value: ordersByStatus.Pending || 0,
      icon: ClockIcon,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Total Users',
      value: totalUsers,
      icon: UsersIcon,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      title: 'Low/Out of Stock',
      value: inventoryAlertsResponse?.count || 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-rose-50 text-rose-700',
    },
    {
      title: 'Unresolved Feedback',
      value: feedbackStatsResponse?.stats?.unresolvedCount || 0,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-purple-50 text-purple-700',
    },
    {
      title: 'Active Promotions',
      value: promotionsResponse?.pagination?.total || promotionsResponse?.promotions?.length || 0,
      icon: MegaphoneIcon,
      color: 'bg-orange-50 text-orange-700',
    },
  ];

  const quickLinks = [
    { label: 'Manage Users', path: '/admin/dashboard#user-crud' },
    { label: 'Manage Menu', path: '/admin/menu' },
    { label: 'Manage Inventory', path: '/admin/inventory' },
    { label: 'Manage Orders', path: '/admin/orders' },
    { label: 'Manage Promotions', path: '/admin/promotions' },
    { label: 'Manage Feedback', path: '/admin/feedback' },
  ];

  const currentUserId = currentUser?._id || currentUser?.id;

  const handleApplyFilters = (event) => {
    event.preventDefault();
    setUserFilters({
      search: searchInput.trim(),
      role: roleFilterInput,
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setRoleFilterInput('');
    setUserFilters({ search: '', role: '' });
  };

  const handleCreateFormChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateStaff = (event) => {
    event.preventDefault();

    const name = createForm.name.trim();
    const email = createForm.email.trim();
    const password = createForm.password;
    const phone = createForm.phone.trim();

    if (!name || !email || !password) {
      toast.error('Name, email, and password are required');
      return;
    }

    createStaffMutation.mutate({
      name,
      email,
      password,
      ...(phone ? { phone } : {}),
    });
  };

  const startEditingUser = (selectedUser) => {
    setEditingUserId(selectedUser._id);
    setEditForm({
      name: selectedUser.name || '',
      email: selectedUser.email || '',
      role: selectedUser.role || 'customer',
      phone: selectedUser.phone || '',
      password: '',
    });
  };

  const cancelEditingUser = () => {
    setEditingUserId('');
    setEditForm(EMPTY_EDIT_FORM);
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateUser = (id) => {
    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
    };

    if (!payload.name || !payload.email) {
      toast.error('Name and email are required');
      return;
    }

    const phone = editForm.phone.trim();
    if (phone) {
      payload.phone = phone;
    }

    const password = editForm.password.trim();
    if (password) {
      payload.password = password;
    }

    updateUserMutation.mutate({ id, payload });
  };

  const handleDeleteUser = (selectedUser) => {
    if (selectedUser._id === currentUserId) {
      toast.error('You cannot delete your own account');
      return;
    }

    const shouldDelete = window.confirm(`Delete user ${selectedUser.email}?`);
    if (!shouldDelete) {
      return;
    }

    deleteUserMutation.mutate(selectedUser._id);
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-28 rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <span className="text-sm text-gray-500">Auto-refreshes every 30-60 seconds</span>
        </div>

      {dataErrors.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Some dashboard data could not be loaded. The rest of the dashboard is still available.
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Order Status Analysis</h2>

          {totalOrdersInChart > 0 ? (
            <div className="space-y-3">
              {orderStatusChartData.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${(item.value / maxOrderStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No order status data available yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recent Order Value Trend</h2>

          {recentOrderTrendPoints.length > 0 ? (
            <>
              <div className="rounded-lg bg-gray-50 p-3">
                <svg viewBox="0 0 100 100" className="h-52 w-full">
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.8" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.8" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.8" />

                  <polygon points={recentOrderAreaPoints} fill="#dbeafe" />
                  <polyline
                    points={recentOrderLinePoints}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  {recentOrderTrendPoints.map((point) => (
                    <circle key={point.id} cx={point.x} cy={point.y} r="2.2" fill="#1d4ed8" />
                  ))}
                </svg>
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                {recentOrderTrendPoints.map((point) => (
                  <div key={`${point.id}-label`} className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-xs text-gray-500">{point.label}</p>
                    <p className="text-xs font-semibold text-gray-900">{formatCurrency(point.total)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">No recent order trend data available yet.</p>
          )}
        </div>
      </section>

      <section
        id="user-crud"
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">User CRUD</h2>
            <p className="text-sm text-gray-500">Fetch, create, edit, and delete users directly from dashboard.</p>
          </div>
          <p className="text-sm text-gray-500">{usersResponse?.pagination?.total || users.length} users found</p>
        </div>

        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or email"
            className="input-field md:col-span-2"
          />
          <select
            value={roleFilterInput}
            onChange={(event) => setRoleFilterInput(event.target.value)}
            className="input-field"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="customer">Customer</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary w-full">
              Apply
            </button>
            <button type="button" onClick={handleResetFilters} className="btn-secondary w-full">
              Reset
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <form onSubmit={handleCreateStaff} className="rounded-lg border border-gray-200 p-4 bg-gray-50 space-y-3">
            <h3 className="font-semibold">Create Staff User</h3>
            <input
              type="text"
              name="name"
              value={createForm.name}
              onChange={handleCreateFormChange}
              placeholder="Full name"
              className="input-field"
              required
            />
            <input
              type="email"
              name="email"
              value={createForm.email}
              onChange={handleCreateFormChange}
              placeholder="Email"
              className="input-field"
              required
            />
            <input
              type="password"
              name="password"
              value={createForm.password}
              onChange={handleCreateFormChange}
              placeholder="Password"
              className="input-field"
              minLength={8}
              required
            />
            <input
              type="text"
              name="phone"
              value={createForm.phone}
              onChange={handleCreateFormChange}
              placeholder="Phone (optional)"
              className="input-field"
            />
            <button
              type="submit"
              className="btn-primary w-full disabled:opacity-50"
              disabled={createStaffMutation.isLoading}
            >
              {createStaffMutation.isLoading ? 'Creating...' : 'Create Staff'}
            </button>
          </form>

          <div className="lg:col-span-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Phone</th>
                  <th className="py-2 pr-3">Created</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((item) => {
                    const isEditing = editingUserId === item._id;
                    return (
                      <tr key={item._id} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          {isEditing ? (
                            <input
                              type="text"
                              name="name"
                              value={editForm.name}
                              onChange={handleEditFormChange}
                              className="input-field"
                            />
                          ) : (
                            item.name
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {isEditing ? (
                            <input
                              type="email"
                              name="email"
                              value={editForm.email}
                              onChange={handleEditFormChange}
                              className="input-field"
                            />
                          ) : (
                            item.email
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {isEditing ? (
                            <select
                              name="role"
                              value={editForm.role}
                              onChange={handleEditFormChange}
                              className="input-field"
                            >
                              <option value="admin">Admin</option>
                              <option value="staff">Staff</option>
                              <option value="customer">Customer</option>
                            </select>
                          ) : (
                            <span className="capitalize">{item.role}</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {isEditing ? (
                            <input
                              type="text"
                              name="phone"
                              value={editForm.phone}
                              onChange={handleEditFormChange}
                              className="input-field"
                            />
                          ) : (
                            item.phone || 'N/A'
                          )}
                        </td>
                        <td className="py-2 pr-3 text-gray-500">{formatDateTime(item.createdAt)}</td>
                        <td className="py-2 pr-3">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="btn-primary btn-xs"
                                onClick={() => handleUpdateUser(item._id)}
                                disabled={updateUserMutation.isLoading}
                              >
                                {updateUserMutation.isLoading ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                className="btn-secondary btn-xs"
                                onClick={cancelEditingUser}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="btn-ghost btn-xs"
                                onClick={() => startEditingUser(item)}
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-danger btn-xs"
                                onClick={() => handleDeleteUser(item)}
                                disabled={deleteUserMutation.isLoading || item._id === currentUserId}
                              >
                                <TrashIcon className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No users found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-primary text-sm font-medium hover:underline">
              View all
            </Link>
          </div>

          {dashboardStats.recentOrders?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Order ID</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardStats.recentOrders.map((order) => (
                    <tr key={order._id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{order._id.slice(-8)}</td>
                      <td className="py-2 pr-4">{order.customer?.name || 'N/A'}</td>
                      <td className="py-2 pr-4">{formatCurrency(order.total)}</td>
                      <td className="py-2 pr-4">{order.status}</td>
                      <td className="py-2 pr-4 text-gray-500">{formatDateTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No recent orders found.</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="btn-ghost btn-sm w-full justify-start"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Items Section */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Popular Menu Items</h2>
          <Link to="/admin/menu" className="text-primary text-sm font-medium hover:underline">
            View all
          </Link>
        </div>

        {menuItemsResponse?.menuItems?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {menuItemsResponse.menuItems.slice(0, 8).map((item) => (
              <div key={item._id} className="text-center">
                <div className="h-20 bg-gray-100 rounded-lg mb-2 relative overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image.startsWith('http') ? item.image : `http://localhost:4000${item.image}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ display: item.image ? 'none' : 'flex' }}
                  >
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                  item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.isAvailable ? 'Available' : 'Out of Stock'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No menu items found.</p>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Low Stock Alerts</h2>
          {inventoryAlertsResponse?.lowStockItems?.length ? (
            <ul className="space-y-2">
              {inventoryAlertsResponse.lowStockItems.slice(0, 8).map((item) => (
                <li key={item._id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <div>
                    <p className="font-medium text-gray-900">{item.item}</p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No low stock alerts right now.</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Feedback Snapshot</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Total Feedback</p>
              <p className="text-xl font-bold">{feedbackStatsResponse?.stats?.totalFeedback || 0}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Average Rating</p>
              <p className="text-xl font-bold">
                {(feedbackStatsResponse?.stats?.averageRating || 0).toFixed(1)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Rating Distribution</p>
            {feedbackStatsResponse?.stats?.ratingDistribution?.length ? (
              <ul className="space-y-1 text-sm">
                {feedbackStatsResponse.stats.ratingDistribution.map((item) => (
                  <li key={item._id} className="flex items-center justify-between">
                    <span>{item._id} star</span>
                    <span className="font-medium">{item.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No feedback data yet.</p>
            )}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
