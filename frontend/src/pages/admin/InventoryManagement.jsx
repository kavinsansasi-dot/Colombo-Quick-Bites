import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import {
  ExclamationTriangleIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { inventoryApi } from '../../utils/api';

const CATEGORIES = ['Vegetables', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Packaging'];
const UNITS = ['kg', 'liters', 'pieces', 'boxes'];
const STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'];

const EMPTY_FORM = {
  item: '',
  category: 'Vegetables',
  quantity: '',
  minimumStock: '10',
  unit: 'pieces',
  supplierName: '',
  supplierContact: '',
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
  return new Date(value).toISOString().split('T')[0];
};

const getStatusBadgeClass = (status) => {
  if (status === 'Out of Stock') return 'badge-error';
  if (status === 'Low Stock') return 'badge-warning';
  return 'badge-success';
};

const InventoryManagement = () => {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [categoryFilterInput, setCategoryFilterInput] = useState('');
  const [statusFilterInput, setStatusFilterInput] = useState('');
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);

  const {
    data: inventorySummaryResponse,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useQuery('adminInventorySummary', () => inventoryApi.getInventory({ page: 1, limit: 500 }), {
    refetchOnWindowFocus: false,
    refetchInterval: 60000,
  });

  const {
    data: inventoryListResponse,
    isLoading: isListLoading,
    error: listError,
  } = useQuery(
    ['adminInventoryList', filters.search, filters.category, filters.status],
    () =>
      inventoryApi.getInventory({
        page: 1,
        limit: 200,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchInterval: 30000,
    }
  );

  const {
    data: inventoryAlertsResponse,
    isLoading: isAlertsLoading,
    error: alertsError,
  } = useQuery('adminInventoryAlerts', () => inventoryApi.getLowStockAlerts(), {
    refetchOnWindowFocus: false,
    refetchInterval: 30000,
  });

  const refreshInventoryData = () => {
    queryClient.invalidateQueries('adminInventorySummary');
    queryClient.invalidateQueries(['adminInventoryList']);
    queryClient.invalidateQueries('adminInventoryAlerts');
  };

  const createInventoryMutation = useMutation(
    (payload) => inventoryApi.createInventoryItem(payload),
    {
      onSuccess: () => {
        toast.success('Inventory item created');
        setIsModalOpen(false);
        setFormData(EMPTY_FORM);
        refreshInventoryData();
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    }
  );

  const updateInventoryMutation = useMutation(
    ({ id, payload }) => inventoryApi.updateInventoryItem(id, payload),
    {
      onSuccess: () => {
        toast.success('Inventory item updated');
        setIsModalOpen(false);
        setEditingId('');
        setFormData(EMPTY_FORM);
        refreshInventoryData();
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    }
  );

  const deleteInventoryMutation = useMutation((id) => inventoryApi.deleteInventoryItem(id), {
    onSuccess: () => {
      toast.success('Inventory item deleted');
      refreshInventoryData();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const isLoading = isSummaryLoading || isListLoading || isAlertsLoading;
  const dataErrors = [summaryError, listError, alertsError].filter(Boolean);

  const summaryInventory = inventorySummaryResponse?.inventory || [];
  const inventoryList = inventoryListResponse?.inventory || [];
  const lowStockItems = inventoryAlertsResponse?.lowStockItems || [];

  const totalItems = inventorySummaryResponse?.pagination?.total || summaryInventory.length;
  const lowStockCount = inventoryAlertsResponse?.count || 0;
  const categoriesCount = new Set(summaryInventory.map((item) => item.category)).size;

  const handleApplyFilters = (event) => {
    event.preventDefault();
    setFilters({
      search: searchInput.trim(),
      category: categoryFilterInput,
      status: statusFilterInput,
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setCategoryFilterInput('');
    setStatusFilterInput('');
    setFilters({ search: '', category: '', status: '' });
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId('');
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setEditingId(item._id);
    setFormData({
      item: item.item || '',
      category: item.category || 'Vegetables',
      quantity: String(item.quantity ?? ''),
      minimumStock: String(item.minimumStock ?? 10),
      unit: item.unit || 'pieces',
      supplierName: item.supplier?.name || '',
      supplierContact: item.supplier?.contact || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId('');
    setFormData(EMPTY_FORM);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveItem = (event) => {
    event.preventDefault();

    const itemName = formData.item.trim();
    const quantityValue = Number(formData.quantity);
    const minimumStockValue = Number(formData.minimumStock);

    if (!itemName) {
      toast.error('Item name is required');
      return;
    }

    if (Number.isNaN(quantityValue) || quantityValue < 0) {
      toast.error('Quantity must be 0 or greater');
      return;
    }

    if (Number.isNaN(minimumStockValue) || minimumStockValue < 0) {
      toast.error('Minimum stock must be 0 or greater');
      return;
    }

    const payload = {
      item: itemName,
      category: formData.category,
      quantity: quantityValue,
      minimumStock: minimumStockValue,
      unit: formData.unit,
    };

    const supplierName = formData.supplierName.trim();
    const supplierContact = formData.supplierContact.trim();

    if (supplierName || supplierContact) {
      payload.supplier = {
        name: supplierName,
        contact: supplierContact,
      };
    }

    if (modalMode === 'edit' && editingId) {
      updateInventoryMutation.mutate({ id: editingId, payload });
      return;
    }

    createInventoryMutation.mutate(payload);
  };

  const handleDeleteItem = (item) => {
    const shouldDelete = window.confirm(`Delete inventory item ${item.item}?`);
    if (!shouldDelete) return;
    deleteInventoryMutation.mutate(item._id);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
        <p className="text-gray-600 mb-8">Track and manage stock levels</p>
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
          <p className="text-gray-600">Track and manage stock levels</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <PlusIcon className="h-5 w-5" />
          Add Stock Item
        </button>
      </div>

      {dataErrors.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Some inventory data could not be loaded. Please refresh the page.
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Items</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{totalItems}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center">
              <CubeIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Low Stock Alerts</p>
              <p className="text-4xl font-bold text-orange-600 mt-2">{lowStockCount}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Categories</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{categoriesCount}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <Squares2X2Icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      {lowStockCount > 0 && (
        <section className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-900">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 mt-0.5 text-orange-600" />
            <div>
              <h2 className="font-semibold text-lg">Low Stock Warning</h2>
              <p className="mt-1 text-sm">
                {lowStockCount} item(s) need restocking:{' '}
                {lowStockItems.slice(0, 8).map((item) => item.item).join(', ')}
                {lowStockItems.length > 8 ? '...' : ''}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="card border border-gray-200 p-4">
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2 relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search inventory..."
              className="input-field pl-10"
            />
          </div>

          <select
            value={categoryFilterInput}
            onChange={(event) => setCategoryFilterInput(event.target.value)}
            className="input-field"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={statusFilterInput}
            onChange={(event) => setStatusFilterInput(event.target.value)}
            className="input-field"
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
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
      </section>

      <section className="card border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b bg-gray-50">
              <th className="py-3 px-4">Item Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Quantity</th>
              <th className="py-3 px-4">Min Stock</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Updated</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventoryList.length > 0 ? (
              inventoryList.map((item) => (
                <tr key={item._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{item.item}</td>
                  <td className="py-3 px-4">{item.category}</td>
                  <td className="py-3 px-4">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-3 px-4">
                    {item.minimumStock} {item.unit}
                  </td>
                  <td className="py-3 px-4">
                    <span className={getStatusBadgeClass(item.status)}>{item.status}</span>
                  </td>
                  <td className="py-3 px-4">{formatDate(item.lastUpdated || item.updatedAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="btn-ghost btn-icon-sm"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item)}
                        className="btn-danger btn-icon-sm"
                        title="Delete"
                        disabled={deleteInventoryMutation.isLoading}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-500">
                  No inventory items found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">
                {modalMode === 'edit' ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="btn-ghost btn-icon"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <input
                    id="item"
                    name="item"
                    value={formData.item}
                    onChange={handleFormChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="input-field"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleFormChange}
                    className="input-field"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={handleFormChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="minimumStock" className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Stock
                  </label>
                  <input
                    id="minimumStock"
                    name="minimumStock"
                    type="number"
                    min="0"
                    value={formData.minimumStock}
                    onChange={handleFormChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name (Optional)
                  </label>
                  <input
                    id="supplierName"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleFormChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="supplierContact" className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Contact (Optional)
                  </label>
                  <input
                    id="supplierContact"
                    name="supplierContact"
                    value={formData.supplierContact}
                    onChange={handleFormChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary disabled:opacity-50"
                  disabled={createInventoryMutation.isLoading || updateInventoryMutation.isLoading}
                >
                  {createInventoryMutation.isLoading || updateInventoryMutation.isLoading
                    ? 'Saving...'
                    : modalMode === 'edit'
                      ? 'Update Item'
                      : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
