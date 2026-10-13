import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import {
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { menuApi } from '../../utils/api';

const CATEGORIES = [
  'Burger',
  'Pizza', 
  'Drinks',
  'Rice',
  'Desserts'
];

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  description: '',
  isAvailable: true,
  image: null,
  stockQuantity: 0,
  lowStockThreshold: 5,
};

const MenuItemsPage = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState('');
  const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message || error?.response?.data?.error || fallback;

  // Always call hooks at the top level
  const {
    data: menuItemsResponse,
    isLoading: isMenuLoading,
  } = useQuery(
    ['adminMenuItems', searchTerm, selectedCategory],
    () =>
      menuApi.getMenuItems({
        search: searchTerm,
        category: selectedCategory,
        page: 1,
        limit: 100,
        showAll: true,
      }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      enabled: currentUser?.role === 'admin', // Only enable query for admin users
    }
  );

  const createMenuItemMutation = useMutation(
    (formData) => menuApi.createMenuItem(formData),
    {
      onSuccess: () => {
        toast.success('Menu item created successfully');
        closeModal();
        queryClient.invalidateQueries('adminMenuItems');
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(error, 'Failed to create menu item');
        toast.error(errorMessage);
      },
    }
  );

  const updateMenuItemMutation = useMutation(
    ({ id, formData }) => menuApi.updateMenuItem(id, formData),
    {
      onSuccess: () => {
        toast.success('Menu item updated successfully');
        closeModal();
        queryClient.invalidateQueries('adminMenuItems');
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(error, 'Failed to update menu item');
        toast.error(errorMessage);
      },
    }
  );

  const deleteMenuItemMutation = useMutation(
    (id) => menuApi.deleteMenuItem(id),
    {
      onSuccess: () => {
        toast.success('Menu item deleted successfully');
        queryClient.invalidateQueries('adminMenuItems');
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(error, 'Failed to delete menu item');
        toast.error(errorMessage);
      },
    }
  );

  // Check if user is admin and return early if not
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page. Admin access required.</p>
        </div>
      </div>
    );
  }

  const menuItems = menuItemsResponse?.menuItems || [];

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || '',
      price: item.price || '',
      description: item.description || '',
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      image: null,
      stockQuantity: item.stockQuantity || 0,
      lowStockThreshold: item.lowStockThreshold || 5,
    });
    setImagePreview(item.image || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setImagePreview('');
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    // Create FormData for file upload
    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('category', formData.category);
    submitData.append('price', parseFloat(formData.price));
    submitData.append('description', formData.description.trim());
    submitData.append('isAvailable', formData.isAvailable);
    submitData.append('stockQuantity', parseInt(formData.stockQuantity));
    submitData.append('lowStockThreshold', parseInt(formData.lowStockThreshold));
    
    if (formData.image) {
      submitData.append('image', formData.image);
    }

    if (editingItem) {
      updateMenuItemMutation.mutate({ id: editingItem._id, formData: submitData });
    } else {
      createMenuItemMutation.mutate(submitData);
    }
  };

  const handleDelete = (item) => {
    const shouldDelete = window.confirm(`Are you sure you want to delete "${item.name}"?`);
    if (shouldDelete) {
      deleteMenuItemMutation.mutate(item._id);
    }
  };

  const handleAvailabilityToggle = (item) => {
    const updatedData = new FormData();
    updatedData.append('isAvailable', !item.isAvailable);
    
    updateMenuItemMutation.mutate({ 
      id: item._id, 
      formData: updatedData 
    });
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview('');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const getStockStatusColor = (status) => {
    const colors = {
      'in_stock': 'bg-green-100 text-green-800',
      'low_stock': 'bg-yellow-100 text-yellow-800',
      'out_of_stock': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStockStatusText = (status) => {
    const texts = {
      'in_stock': 'In Stock',
      'low_stock': 'Low Stock',
      'out_of_stock': 'Out of Stock',
    };
    return texts[status] || 'Unknown';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Burger': 'bg-amber-100 text-amber-800',
      'Pizza': 'bg-red-100 text-red-800',
      'Drinks': 'bg-blue-100 text-blue-800',
      'Rice': 'bg-green-100 text-green-800',
      'Desserts': 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // If it starts with /uploads, construct full URL without /api
    if (imagePath.startsWith('/uploads')) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const cleanBaseUrl = baseUrl.replace('/api', ''); // Remove /api if present
      const fullUrl = `${cleanBaseUrl}${imagePath}`;
      console.log('Generated image URL:', fullUrl, 'from path:', imagePath);
      return fullUrl;
    }
    // Otherwise, assume it's a relative path
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const cleanBaseUrl = baseUrl.replace('/api', ''); // Remove /api if present
    const fullUrl = `${cleanBaseUrl}/uploads/${imagePath}`;
    console.log('Generated image URL (relative):', fullUrl, 'from path:', imagePath);
    return fullUrl;
  };

  if (isMenuLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-80"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Menu Items</h1>
        <button
          onClick={openAddModal}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5" />
          Add New Item
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryFilter(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menuItems.length > 0 ? (
          menuItems.map((item) => (
            <div
              key={item._id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-200 ${
                item.isAvailable 
                  ? 'border-gray-200 hover:shadow-md hover:border-gray-300' 
                  : 'border-gray-200 opacity-75'
              }`}
            >
              {/* Card Image */}
              <div className="h-48 bg-gray-100 relative">
                {item.image ? (
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onLoad={() => console.log('Image loaded successfully:', getImageUrl(item.image))}
                    onError={(e) => {
                      console.log('Image failed to load:', item.image, 'Full URL:', getImageUrl(item.image));
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ display: item.image ? 'none' : 'flex' }}
                >
                  <PhotoIcon className="h-16 w-16 text-gray-400" />
                </div>
                
                {/* Hidden overlay for disabled items */}
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">Hidden from customers</span>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-4">
                {/* Item Name and Category */}
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-3">
                  <span className="text-2xl font-bold text-orange-600">{formatCurrency(item.price)}</span>
                </div>

                {/* Rating */}
                <div className="mb-3 flex items-center gap-1">
                  <StarIconSolid className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-600">
                    {item.rating || '4.5'} ({item.ratingCount || '54'})
                  </span>
                </div>

                {/* Stock Status */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Stock</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(item.stockStatus)}`}>
                      {getStockStatusText(item.stockStatus)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.stockQuantity || 0} units available
                  </div>
                  {item.stockStatus === 'low_stock' && (
                    <div className="text-xs text-yellow-600 mt-1">
                      Low stock - Restock soon!
                    </div>
                  )}
                  {item.stockStatus === 'out_of_stock' && (
                    <div className="text-xs text-red-600 mt-1">
                      Out of stock - Hidden from customers
                    </div>
                  )}
                </div>

                {/* Availability Toggle */}
                <div className="mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={item.isAvailable}
                        onChange={() => handleAvailabilityToggle(item)}
                        className="sr-only"
                        disabled={updateMenuItemMutation.isLoading}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${
                        item.isAvailable ? 'bg-orange-600' : 'bg-gray-300'
                      }`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        item.isAvailable ? 'translate-x-4' : 'translate-x-0'
                      }`}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {item.isAvailable ? 'Visible to customers' : 'Hidden'}
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="btn-ghost btn-sm flex-1"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="btn-danger btn-sm flex-1"
                    disabled={deleteMenuItemMutation.isLoading}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500">
              <PhotoIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">No menu items found</p>
              <p className="text-sm">Try adjusting your search or filters, or add a new item to get started.</p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h2>
                <button
                  onClick={closeModal}
                  className="rounded-md p-2 hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="btn-ghost btn-sm cursor-pointer"
                      >
                        <PhotoIcon className="h-4 w-4" />
                        Choose Image
                      </label>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WEBP up to 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Item Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                    placeholder="Enter item name"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                    required
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price (LKR) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                    placeholder="Enter item description (optional)"
                  />
                </div>

                {/* Availability Toggle */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {formData.isAvailable ? 'Available' : 'Out of Stock'}
                    </span>
                  </label>
                </div>

                {/* Stock Management */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      id="stockQuantity"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleFormChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      id="lowStockThreshold"
                      name="lowStockThreshold"
                      value={formData.lowStockThreshold}
                      onChange={handleFormChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                      placeholder="5"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-white font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                    disabled={createMenuItemMutation.isLoading || updateMenuItemMutation.isLoading}
                  >
                    {editingItem ? (
                      updateMenuItemMutation.isLoading ? 'Updating...' : 'Update Item'
                    ) : (
                      createMenuItemMutation.isLoading ? 'Creating...' : 'Save Item'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-ghost btn-icon"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItemsPage;
