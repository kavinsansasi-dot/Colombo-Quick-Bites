import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { orderApi } from '../../utils/api';

const ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

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

const getStatusBadgeClass = (status) => {
  if (status === 'Delivered') return 'badge-success';
  if (status === 'Ready' || status === 'Preparing') return 'badge-info';
  if (status === 'Cancelled') return 'badge-error';
  return 'badge-warning';
};

const getNextStatuses = (currentStatus) => {
  if (currentStatus === 'Pending') return ['Preparing', 'Cancelled'];
  if (currentStatus === 'Preparing') return ['Ready'];
  if (currentStatus === 'Ready') return ['Delivered'];
  return [];
};

const getApiErrorMessage = (error) => {
  const validationErrors = error?.response?.data?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length) {
    return validationErrors.map((item) => item.msg).join(', ');
  }
  return error?.response?.data?.message || 'Request failed';
};

const StaffOrders = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const {
    data: ordersResponse,
    isLoading,
    error,
  } = useQuery(
    ['staffOrders', statusFilter],
    () =>
      orderApi.getOrders({
        page: 1,
        limit: 200,
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
    {
      refetchOnWindowFocus: false,
      refetchInterval: 30000,
      keepPreviousData: true,
    }
  );

  const updateStatusMutation = useMutation(
    ({ id, status }) => orderApi.updateOrderStatus(id, status),
    {
      onSuccess: () => {
        toast.success('Order status updated successfully');
        queryClient.invalidateQueries(['staffOrders']);
        queryClient.invalidateQueries('staffDashboardOrders');
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    }
  );

  const orders = ordersResponse?.orders || [];

  const handleStatusUpdate = (orderId, status) => {
    updateStatusMutation.mutate({ id: orderId, status });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-2">Staff Orders</h1>
          <p className="text-gray-600">Manage your assigned order queue</p>
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="input-field w-56"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load assigned orders. Please refresh.
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-3 pr-4">Order ID</th>
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Items</th>
                <th className="py-3 pr-4">Phone</th>
                <th className="py-3 pr-4">Total</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Created</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const nextStatuses = getNextStatuses(order.status);
                return (
                  <tr key={order._id} className="border-b last:border-0 align-top">
                    <td className="py-3 pr-4 font-mono text-xs">{order._id.slice(-8)}</td>
                    <td className="py-3 pr-4">{order.customer?.name || 'N/A'}</td>
                    <td className="py-3 pr-4">
                      <div className="max-w-72">
                        {order.items?.length ? (
                          <p className="text-gray-800">
                            {order.items
                              .slice(0, 2)
                              .map((item) => `${item.menuItem?.name || 'Item'} x${item.quantity}`)
                              .join(', ')}
                            {order.items.length > 2 ? ', ...' : ''}
                          </p>
                        ) : (
                          <p className="text-gray-500">No items</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">{order.phone || 'N/A'}</td>
                    <td className="py-3 pr-4">{formatCurrency(order.total)}</td>
                    <td className="py-3 pr-4">
                      <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{formatDateTime(order.createdAt)}</td>
                    <td className="py-3 pr-4">
                      {nextStatuses.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {nextStatuses.map((status) => (
                            <button
                              key={status}
                              type="button"
                              className="btn-outline btn-xs"
                              onClick={() => handleStatusUpdate(order._id, status)}
                              disabled={updateStatusMutation.isLoading}
                            >
                              Mark {status}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-10 text-gray-500">No assigned orders found.</p>
        )}
      </section>
    </div>
  );
};

export default StaffOrders;
