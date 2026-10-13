const express = require('express');
const { body } = require('express-validator');
const { getUsers, createStaff, updateUser, deleteUser } = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const createStaffValidation = [
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
];

const updateUserValidation = [
  body('name').optional().trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('role').optional().isIn(['admin', 'staff', 'customer']).withMessage('Invalid role'),
];

router.get('/', auth, authorize('admin'), getUsers);
router.post('/staff', auth, authorize('admin'), createStaffValidation, createStaff);
router.put('/:id', auth, authorize('admin'), updateUserValidation, updateUser);
router.delete('/:id', auth, authorize('admin'), deleteUser);

module.exports = router;
