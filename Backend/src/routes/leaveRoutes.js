const express = require('express');
const {
  submitLeaveRequest,
  getMyLeaveRequests,
  getPendingApprovals,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
  autoCreditLeaves,
  getTeamCalendar
} = require('../controllers/leaveController');
const { authenticate }   = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateLeaveRequest } = require('../middleware/validationMiddleware');

const router = express.Router();
router.use(authenticate);

router.post('/',            validateLeaveRequest, submitLeaveRequest);
router.get('/mine',        getMyLeaveRequests);
router.get('/pending',     authorizeRoles('Manager','HR','Director'), getPendingApprovals);
router.put('/:id/approve',  authorizeRoles('Manager','HR','Director'), approveLeave);
router.put('/:id/reject',   authorizeRoles('Manager','HR','Director'), rejectLeave);
router.get('/balance',      getLeaveBalance);

// Feature: Auto-credit (to be run by cron)
router.post('/auto-credit', authorizeRoles('Admin'), autoCreditLeaves);

// Team calendar (monthly view)
router.get('/calendar',     getTeamCalendar);

router.get('/manager/pending-approvals',  authenticate, getPendingApprovals);


module.exports = router;
