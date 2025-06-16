const express = require('express');
const {
  createLeavePolicy,
  getLeavePolicies,
  updateLeavePolicy,
  deleteLeavePolicy
} = require('../controllers/leavePolicyController');
const { authenticate }   = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateLeavePolicy } = require('../middleware/validationMiddleware');

const router = express.Router();
router.use(authenticate, authorizeRoles('Admin'));

// POST /api/v1/leave-policies
router.post('/', validateLeavePolicy, createLeavePolicy);

// GET /api/v1/leave-policies
router.get('/', getLeavePolicies);

// PUT /api/v1/leave-policies/:id
router.put('/:id', validateLeavePolicy, updateLeavePolicy);

// DELETE /api/v1/leave-policies/:id
router.delete('/:id', deleteLeavePolicy);

module.exports = router;
