# Colombo Quick Bites - MERN Stack Food Ordering System

A modern, professional food ordering system with role-based access for Admin, Staff, and Customers.

## Tech Stack
- **Frontend**: React.js, Axios, Socket.io-client
- **Backend**: Node.js, Express.js, MongoDB, Socket.io
- **Authentication**: JWT
- **UI Theme**: Professional Orange (#F97316) & White (#FFFFFF)

## Features
- Role-based access control (Admin, Staff, Customer)
- Real-time order tracking
- Menu management with image upload
- Inventory management
- Promotions and feedback system
- Responsive design

## Project Structure
```
quick-bites/
├── backend/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── services/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── utils/
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (installed and running)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quick-bites
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   - Copy `backend/.env` and update the MongoDB URI if needed
   - Create `frontend/.env` with `REACT_APP_API_URL=http://localhost:4000/api`

5. **Start the servers**
   
   **Option 1: Use the startup script**
   - Windows: Double-click `start.bat`
   - Linux/Mac: Run `chmod +x start.sh && ./start.sh`
   
   **Option 2: Manual start**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000/api

### Default Admin Account
After starting the application, you can register an admin account with:
- Email: admin@quickbites.lk
- Password: admin123
- Role: admin (select during registration)

## User Roles
- **Admin**: Full system access
- **Staff**: Limited access to assigned orders and inventory
- **Customer**: Browse menu, place orders, track deliveries
