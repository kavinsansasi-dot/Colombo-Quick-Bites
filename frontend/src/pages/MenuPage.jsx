import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PhotoIcon,
  StarIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'; // eslint-disable-line no-unused-vars
import { menuApi } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All',
  'Burger',
  'Pizza', 
  'Drinks',
  'Rice',
  'Desserts'
];

const MenuPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addToCart, itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = (menuItem) => {
    if (!isAuthenticated) {
      toast.error('Please register or login to add items to cart');
      navigate('/register');
      return;
    }
    addToCart(menuItem, 1);
  };

  const {
    data: menuItemsResponse,
    isLoading: isMenuLoading,
    error: menuError,
  } = useQuery(
    ['customerMenuItems', searchTerm, selectedCategory],
    () => {
      const params = {
        search: searchTerm,
        page: 1,
        limit: 50,
      };
      
      // Only add category filter if not "All"
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      
      return menuApi.getMenuItems(params);
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const menuItems = menuItemsResponse?.menuItems?.filter(item => item.isAvailable) || [];

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === selectedCategory ? 'All' : category);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(value || 0);
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
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    if (imagePath.startsWith('/uploads')) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const cleanBaseUrl = baseUrl.replace('/api', '');
      return `${cleanBaseUrl}${imagePath}`;
    }
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const cleanBaseUrl = baseUrl.replace('/api', '');
    return `${cleanBaseUrl}/uploads/${imagePath}`;
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

  if (menuError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading menu items. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Menu</h1>
          <p className="text-lg text-gray-600">Discover our delicious selection of food and drinks</p>
        </div>
        <Link 
          to="/cart" 
          className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors"
        >
          <ShoppingCartIcon className="h-8 w-8" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
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
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-300"
            >
              {/* Card Image */}
              <div className="h-48 bg-gray-100 relative">
                {item.image ? (
                  <img
                    src={getImageUrl(item.image)}
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
                  <PhotoIcon className="h-16 w-16 text-gray-400" />
                </div>
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

                {/* Description */}
                {item.description && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  </div>
                )}

                {/* Price */}
                <div className="mb-3">
                  <span className="text-2xl font-bold text-orange-600">{formatCurrency(item.price)}</span>
                </div>

                {/* Rating */}
                <div className="mb-4 flex items-center gap-1">
                  <StarIconSolid className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-600">
                    {item.rating || '4.5'} ({item.ratingCount || '54'})
                  </span>
                </div>

                {/* Add to Cart Button */}
                <button 
                  onClick={() => handleAddToCart(item)}
                  className={`w-full rounded-lg px-4 py-2 font-medium transition-colors flex items-center justify-center gap-2 ${
                    isAuthenticated 
                      ? 'bg-orange-600 text-white hover:bg-orange-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <ShoppingCartIcon className="h-5 w-5" />
                  {isAuthenticated ? 'Add to Cart' : 'Login to Add'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500">
              <PhotoIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">No menu items available</p>
              <p className="text-sm">
                {searchTerm || selectedCategory !== 'All' 
                  ? 'Try adjusting your search or filters' 
                  : 'Check back later for delicious items!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
