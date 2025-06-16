const express = require('express');
const {
  createLeaveType,
  getLeaveTypes,
  updateLeaveType,
  deleteLeaveType
} = require('../controllers/leaveTypeController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateLeaveType } = require('../middleware/validationMiddleware');

const router = express.Router();

// Apply authentication and role authorization globally on all routes
router.use(authenticate);  // First authenticate all requests

// POST /api/v1/leave-types
router.post('/', authorizeRoles('Admin'), validateLeaveType, createLeaveType);

// GET /api/v1/leave-types (this could be available to managers and admins)
router.get('/', authorizeRoles('Admin', 'Manager'), getLeaveTypes);

// PUT /api/v1/leave-types/:id
router.put('/:id', authorizeRoles('Admin'), validateLeaveType, updateLeaveType);

// DELETE /api/v1/leave-types/:id
router.delete('/:id', authorizeRoles('Admin'), deleteLeaveType);

module.exports = router;
