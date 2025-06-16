// /routes/approvalRoutes.js
const express = require('express');
const router = express.Router();

const {
  getPendingApprovals,
  approveStep,
  rejectStep
} = require('../controllers/approvalController');

const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles  } = require('../middleware/roleMiddleware');

// All approval‐related routes require authentication + Manager/HR role
router.use(authenticate);
router.use(authorizeRoles );

// View all steps waiting for the logged‐in approver
router.get('/pending', getPendingApprovals);

// Approve a specific step
router.post('/:stepId/approve', approveStep);

// Reject a specific step
router.post('/:stepId/reject', rejectStep);

module.exports = router;
