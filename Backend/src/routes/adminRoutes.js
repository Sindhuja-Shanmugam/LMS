const express = require('express');
const admin = require('../controllers/adminController');
const { authenticate }   = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateLeaveType, validateHoliday } = require('../middleware/validationMiddleware');

const router = express.Router();
router.use(authenticate, authorizeRoles('Admin'));

// Leave Types
router.post('/leave-types',  validateLeaveType, admin.createLeaveType);
router.get('/leave-types',   admin.getAllLeaveTypes);
router.put('/leave-types/:id', validateLeaveType, admin.updateLeaveType);
router.delete('/leave-types/:id', admin.deleteLeaveType);

// Holidays
router.post('/holidays',    validateHoliday, admin.createHoliday);
router.get('/holidays',     admin.getHolidays);
router.delete('/holidays/:id', admin.deleteHoliday);

// Approval Steps
router.post('/approval-steps', admin.create_approval_steps);
router.get('/approval-steps',  admin.getApprovalSteps);
router.delete('/approval-steps/:id', admin.delete_approval_steps);

// Departments
router.post('/departments', admin.create_Departments);
router.get('/departments',  admin.getDepartment);
router.delete('/departments/:id', admin.delete_Department);

// Roles
router.post('/roles', admin.create_Roles);
router.get('/roles',  admin.getRoles);
router.delete('/roles/:id', admin.delete_Roles);

// Leave Statuses
router.post('/leave-statuses', admin.create_leaveStatuses);
router.get('/leave-statuses',  admin.getLeaveStatuses);
router.delete('/leave-statuses/:id', admin.delete_LeaveStatuses);

module.exports = router;
