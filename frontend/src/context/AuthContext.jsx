import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authApi } from '../utils/api';
import toast from 'react-hot-toast';

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: false,
};

const getAuthPayload = (response) => {
  if (!response || !response.success) return null;

  if (response.data?.user && response.data?.token) {
    return {
      user: response.data.user,
      token: response.data.token,
    };
  }

  if (response.user && response.token) {
    return {
      user: response.user,
      token: response.token,
    };
  }

  return null;
};

const getUserPayload = (response) => {
  if (!response || !response.success) return null;
  if (response.data) return response.data;
  if (response.user) return response.user;
  return null;
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authApi.getMe();
          const user = getUserPayload(response);
          if (user) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user, token },
            });
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authApi.login(email, password);
      const authPayload = getAuthPayload(response);
      if (authPayload) {
        const { user, token } = authPayload;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
        toast.success('Login successful!');
        return user;
      }
      throw new Error('Invalid login response');
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (name, email, password, role) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authApi.register(name, email, password, role);
      const authPayload = getAuthPayload(response);
      if (authPayload) {
        const { user, token } = authPayload;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
        toast.success('Registration successful!');
        return user;
      }
      throw new Error('Invalid registration response');
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
