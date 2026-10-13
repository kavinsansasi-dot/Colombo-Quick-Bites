const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

const registerValidation = [
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateMeValidation = [
  body('name').optional().trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('address.street').optional().isString().withMessage('Street must be a string'),
  body('address.city').optional().isString().withMessage('City must be a string'),
  body('address.postalCode').optional().isString().withMessage('Postal code must be a string'),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', auth, getMe);
router.put('/me', auth, updateMeValidation, updateMe);

module.exports = router;
