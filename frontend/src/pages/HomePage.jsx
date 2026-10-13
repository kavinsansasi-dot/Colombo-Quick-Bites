import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { menuApi } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  ClockIcon,
  FireIcon,
  TruckIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const HomePage = () => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleAddToCart = (menuItem) => {
    if (!isAuthenticated) {
      toast.error('Please register or login to add items to cart');
      navigate('/register');
      return;
    }
    addToCart(menuItem);
  };

  const { data: menuItemsResponse, isLoading } = useQuery(
    'featuredMenuItems',
    () => menuApi.getMenuItems({ limit: 8 }),
    { refetchOnWindowFocus: false }
  );

  const { data: categoriesResponse } = useQuery(
    'categories',
    () => menuApi.getCategories(),
    { refetchOnWindowFocus: false }
  );

  const menuItems = menuItemsResponse?.data || [];
  const categories = categoriesResponse?.data || [];

  // Fallback sample data if API fails
  const sampleMenuItems = [
    {
      _id: '1',
      name: 'Chicken Burger',
      description: 'Juicy chicken patty with fresh vegetables and special sauce',
      price: 850,
      category: 'Burgers',
      rating: 4.5,
      preparationTime: 15,
      image: null
    },
    {
      _id: '2', 
      name: 'Pizza Margherita',
      description: 'Classic Italian pizza with fresh mozzarella and basil',
      price: 1200,
      category: 'Pizza',
      rating: 4.8,
      preparationTime: 20,
      image: null
    },
    {
      _id: '3',
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with parmesan and croutons',
      price: 650,
      category: 'Salads',
      rating: 4.2,
      preparationTime: 10,
      image: null
    }
  ];

  const featuredItems = (menuItems.length > 0 ? menuItems : sampleMenuItems).slice(0, 6);
  const filteredItems = selectedCategory === 'All' 
    ? featuredItems 
    : featuredItems.filter((item) => item.category === selectedCategory);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <StarIconSolid
            key={index}
            className={`h-4 w-4 ${
              index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const features = [
    {
      icon: <TruckIcon className="h-8 w-8" />,
      title: 'Fast Delivery',
      description: 'Get your food delivered in 30-45 minutes',
    },
    {
      icon: <FireIcon className="h-8 w-8" />,
      title: 'Fresh Food',
      description: 'Prepared with the freshest ingredients',
    },
    {
      icon: <CreditCardIcon className="h-8 w-8" />,
      title: 'Easy Payment',
      description: 'Multiple payment options available',
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8" />,
      title: 'Quality Guaranteed',
      description: '100% satisfaction guaranteed',
    },
  ];

  const howItWorks = [
    { step: 1, title: 'Browse Menu', description: 'Explore our delicious menu' },
    { step: 2, title: 'Add to Cart', description: 'Choose your favorite items' },
    { step: 3, title: 'Place Order', description: 'Checkout with secure payment' },
    { step: 4, title: 'Enjoy Food', description: 'Get fresh food at your doorstep' },
  ];

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-xl mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-200 rounded-xl h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-primary-dark text-white bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url("https://t4.ftcdn.net/jpg/02/84/46/89/360_F_284468940_1bg6BwgOfjCnE3W0wkMVMVqddJgtMynE.jpg")'}}>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Delicious Food Delivered Fast
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-orange-100 max-w-2xl mx-auto">
              Order from Colombo's favorite food delivery service
            </p>
            <div className="flex flex-row gap-4 justify-center">
              <Link to="/menu" className="btn-primary text-lg px-4 py-4">
                View Menu
              </Link>
              <Link to="/register" className="btn-secondary text-lg px-4 py-4">
                Order Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Menu Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">Featured Menu Items</h2>
          <p className="text-gray-600 text-xl">Try our most popular dishes</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-6 py-3 rounded-full transition-all font-medium ${
              selectedCategory === 'All'
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full transition-all font-medium ${
                selectedCategory === category
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div key={item._id} className="card rounded-2xl overflow-hidden group hover:shadow-2xl transition-shadow">
              <div className="relative h-56 bg-card">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-6xl">🍽️</span>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-panel rounded-full px-3 py-2 text-sm font-semibold text-primary shadow-md">
                  {item.category}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 text-gray-800">{item.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl font-bold text-orange-500">Rs. {item.price}</span>
                  {renderStars(item.rating)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    {item.preparationTime} min
                  </div>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className={`text-sm px-6 py-3 rounded-lg font-semibold transition-colors ${
                      isAuthenticated 
                        ? 'btn-primary' 
                        : 'btn-secondary'
                    }`}
                  >
                    {isAuthenticated ? 'Add to Cart' : 'Login to Add'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link to="/menu" className="btn-primary text-lg px-8 py-4">
            View Full Menu
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">How It Works</h2>
            <p className="text-gray-600 text-xl">Ordering food is easy in 4 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center group">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 group-hover:bg-orange-600 transition-colors shadow-lg">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Order Your Favorite Food?
          </h2>
          <p className="text-xl mb-10 text-orange-100 max-w-2xl mx-auto">
            Join thousands of satisfied customers in Colombo
          </p>
          <Link to="/register" className="btn-primary text-lg px-8 py-4">
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
