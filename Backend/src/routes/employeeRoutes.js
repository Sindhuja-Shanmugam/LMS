const express = require('express');
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  changePassword
} = require('../controllers/employeeController');
const { authenticate }   = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  validateRegistration,
  validateUpdateEmployee,
  validatePasswordUpdate
} = require('../middleware/validationMiddleware');
const { getTeamMembers } = require('../controllers/employeeController');

const router = express.Router();

// POST /api/v1/employees  (Admin)
router.post('/', validateRegistration, createEmployee);

// Below routes require authentication
router.use(authenticate);

// GET /api/v1/employees?page=&limit=  (Admin/HR)
router.get('/', authorizeRoles('Admin', 'HR'), getAllEmployees);


router.get('/me', authenticate, async (req, res) => {
  req.params.id = req.user.id;
  return getEmployeeById(req, res);
});


// GET /api/v1/employees/:id  (self or Admin/HR)
router.get('/:id', authenticate,getEmployeeById);

// PUT /api/v1/employees/:id  (self or Admin/HR)
router.put('/:id', validateUpdateEmployee, updateEmployee);

// DELETE /api/v1/employees/:id  (Admin)
router.delete('/:id', authorizeRoles('Admin'), deleteEmployee);

// PUT /api/v1/employees/:id/password  (self)
router.put('/:id/password', validatePasswordUpdate, changePassword);
router.get('/team', authenticate, authorizeRoles(2), getTeamMembers); 



module.exports = router;
