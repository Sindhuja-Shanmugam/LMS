const express = require('express');
const {
  createApprovalFlow,
  getApprovalFlowByLeave,
  updateApprovalFlow,
  deleteApprovalFlow
} = require('../controllers/approvalFlowController');
const { authenticate }   = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateApprovalFlow } = require('../middleware/validationMiddleware');

const router = express.Router();
router.use(authenticate);

// POST /api/v1/approvals  (Admin/Manager/HR/Director)
router.post('/', authorizeRoles('Admin','Manager','HR','Director'), validateApprovalFlow, createApprovalFlow);

// GET /api/v1/approvals/leave/:leaveId  (Admin/Manager/HR/Director)
router.get('/leave/:leaveId', authorizeRoles('Admin','Manager','HR','Director'), getApprovalFlowByLeave);

// PUT /api/v1/approvals/:id  (Manager/HR/Director)
router.put('/:id', authorizeRoles('Manager','HR','Director'), validateApprovalFlow, updateApprovalFlow);

// DELETE /api/v1/approvals/:id  (Admin)
router.delete('/:id', authorizeRoles('Admin'), deleteApprovalFlow);

//router.get('/pending/:approverId', getPendingApprovals);


module.exports = router;
