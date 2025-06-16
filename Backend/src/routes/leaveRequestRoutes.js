const express = require('express');
const {
  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestsByEmployee,
  updateLeaveRequest,
  deleteLeaveRequest,
  updateApprovalStage,
  getApprovalStatus 
} = require('../controllers/leaveRequestController');
const { authenticate }   = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateLeaveRequest } = require('../middleware/validationMiddleware');
const {getMyLeaveRequests}=require('../controllers/leaveRequestController');
const router = express.Router();
router.use(authenticate);

// POST /api/v1/leave-requests  (self)
router.post('/', validateLeaveRequest, createLeaveRequest);

// GET /api/v1/leave-requests?page=&limit=  (Admin/HR/Manager/Director)
router.get('/', authorizeRoles('Admin', 'HR', 'Manager', 'Director'), getAllLeaveRequests);

// GET /api/v1/leave-requests/employee/:id  (self or Admin/HR/Manager/Director)
router.get('/employee/:id', getLeaveRequestsByEmployee);

// PUT /api/v1/leave-requests/:id  (self if Pending)
router.put('/:id', validateLeaveRequest, updateLeaveRequest);

router.get('/mine',authenticate, getMyLeaveRequests);

// DELETE /api/v1/leave-requests/:id  (self if Pending)
router.delete('/:id', deleteLeaveRequest);

// PUT /api/v1/leave-requests/approval/:id  (Manager/HR/Director)
router.put('/approval/:id', authorizeRoles('Manager', 'HR', 'Director'), updateApprovalStage);

// PUT /api/v1/leave-requests/reject/:id  (Manager/HR/Director)
router.put('/reject/:id', authorizeRoles('Manager', 'HR', 'Director'), updateApprovalStage);

// GET /api/v1/leave-requests/approval-status/:leaveRequestId
router.get(
  '/approval-status/:leaveRequestId',
  authorizeRoles('Admin', 'HR', 'Manager', 'Director', 'Employee'),
  getApprovalStatus
);

module.exports = router;
