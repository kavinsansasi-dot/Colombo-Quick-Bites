import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { orderApi, inventoryApi } from '../../utils/api';

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

const StaffDashboard = () => {
  const {
    data: ordersResponse,
    isLoading: isOrdersLoading,
    error: ordersError,
  } = useQuery('staffDashboardOrders', () => orderApi.getOrders({ page: 1, limit: 200 }), {
    refetchOnWindowFocus: false,
    refetchInterval: 30000,
  });

  const {
    data: lowStockResponse,
    isLoading: isLowStockLoading,
    error: lowStockError,
  } = useQuery('staffDashboardLowStock', () => inventoryApi.getLowStockAlerts(), {
    refetchOnWindowFocus: false,
    refetchInterval: 60000,
  });

  const isLoading = isOrdersLoading || isLowStockLoading;
  const hasError = ordersError || lowStockError;

  const orders = ordersResponse?.orders || [];

  const statusCounts = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {
      Pending: 0,
      Preparing: 0,
      Ready: 0,
      Delivered: 0,
      Cancelled: 0,
    }
  );

  const totalOrderValue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

  const statCards = [
    {
      title: 'Assigned Orders',
      value: orders.length,
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Pending/Preparing',
      value: statusCounts.Pending + statusCounts.Preparing,
      icon: ClockIcon,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Ready/Delivered',
      value: statusCounts.Ready + statusCounts.Delivered,
      icon: CheckCircleIcon,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockResponse?.count || 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-rose-50 text-rose-700',
    },
  ];

  const quickLinks = [
    { label: 'Manage Assigned Orders', path: '/staff/orders' },
    { label: 'Update Profile', path: '/staff/profile' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Staff Dashboard</h1>
        <p className="text-gray-600 mb-8">Monitor assigned orders and operational alerts</p>
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Staff Dashboard</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          Failed to load staff dashboard data. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor assigned orders and operational alerts</p>
        </div>
        <div className="text-sm text-gray-500">Auto-refresh every 30-60 seconds</div>
      </div>

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

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Assigned Orders</h2>
            <Link to="/staff/orders" className="text-primary text-sm font-medium hover:underline">
              View all
            </Link>
          </div>

          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Order ID</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Items</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((order) => (
                    <tr key={order._id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{order._id.slice(-8)}</td>
                      <td className="py-2 pr-4">{order.customer?.name || 'N/A'}</td>
                      <td className="py-2 pr-4">{order.items?.length || 0}</td>
                      <td className="py-2 pr-4">{formatCurrency(order.total)}</td>
                      <td className="py-2 pr-4">{order.status}</td>
                      <td className="py-2 pr-4 text-gray-500">{formatDateTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No orders are currently assigned to you.</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Work Summary</h2>
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-between">
                <span className="text-gray-600">Delivered Order Value</span>
                <span className="font-semibold text-gray-900">{formatCurrency(totalOrderValue)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-600">Cancelled</span>
                <span className="font-semibold text-gray-900">{statusCounts.Cancelled}</span>
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Actions</h3>
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
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <UserCircleIcon className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Low Stock Alerts (Operational)</h2>
        </div>

        {lowStockResponse?.lowStockItems?.length ? (
          <ul className="space-y-2">
            {lowStockResponse.lowStockItems.slice(0, 10).map((item) => (
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
          <p className="text-gray-500">No low-stock alerts at the moment.</p>
        )}
      </section>
    </div>
  );
};

export default StaffDashboard;
