const express = require('express');
const {
  createLeaveBalance,
  getLeaveBalanceByEmployee,
  updateLeaveBalance,
  deleteLeaveBalance,
  autoCreditLeaves,
  carryForwardLeaves
} = require('../controllers/leaveBalanceController');
const { authenticate }   = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateLeaveBalance } = require('../middleware/validationMiddleware');

const router = express.Router();
router.use(authenticate);

// POST /api/v1/leave-balances  (Admin)
router.post('/', validateLeaveBalance, createLeaveBalance);

// GET /api/v1/leave-balances/employee/:id  (self or Admin/HR/Manager/Director)
router.get('/employee/:id', getLeaveBalanceByEmployee);

// PUT /api/v1/leave-balances/:id  (Admin)
router.put('/:id', validateLeaveBalance, updateLeaveBalance);

// DELETE /api/v1/leave-balances/:id  (Admin)
router.delete('/:id', deleteLeaveBalance);

// POST /api/v1/leave-balances/auto-credit  (Admin)
router.post('/auto-credit', authorizeRoles('Admin'), autoCreditLeaves);

// POST /api/v1/leave-balances/carry-forward  (Admin)
router.post('/carry-forward', authorizeRoles('Admin'), carryForwardLeaves);

module.exports = router;
