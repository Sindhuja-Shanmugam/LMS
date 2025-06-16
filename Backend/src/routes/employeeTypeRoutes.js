const express = require('express');
const {
  createEmployeeType,
  getEmployeeTypes,
  updateEmployeeType,
  deleteEmployeeType
} = require('../controllers/employeeTypeController');
const { authenticate }   = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateEmployeeType } = require('../middleware/validationMiddleware');

const router = express.Router();
router.use(authenticate, authorizeRoles('Admin'));

// POST /api/v1/employee-types
router.post('/', validateEmployeeType, createEmployeeType);

// GET /api/v1/employee-types
router.get('/', getEmployeeTypes);

// PUT /api/v1/employee-types/:id
router.put('/:id', validateEmployeeType, updateEmployeeType);

// DELETE /api/v1/employee-types/:id
router.delete('/:id', deleteEmployeeType);

module.exports = router;
