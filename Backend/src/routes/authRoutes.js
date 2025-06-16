const express = require('express');
const { register, login } = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validationMiddleware');

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', validateRegistration, register);

// POST /api/v1/auth/login
router.post('/login', validateLogin, login);

module.exports = router;
