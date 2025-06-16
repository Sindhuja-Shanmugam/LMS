const Joi = require('joi');

// 1. Registration Schema for Employee
const registerSchema = Joi.object({
  name:        Joi.string().trim().required(),
  email:       Joi.string().email().required(),
  password:    Joi.string().min(6).required(),
  emp_type_id: Joi.number().integer().required(),
  manager_id:  Joi.number().integer().allow(null)
});

// 2. Login Schema
const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required()
});

// 3. EmployeeType Schema
const employeeTypeSchema = Joi.object({
  name:        Joi.string().trim().required(),
  description: Joi.string().allow('').optional()
});

// 4. Employee Update Schema
const updateEmployeeSchema = Joi.object({
  name:        Joi.string().trim().optional(),
  email:       Joi.string().email().optional(),
  emp_type_id: Joi.number().integer().optional(),
  manager_id:  Joi.number().integer().allow(null).optional(),
  is_active:   Joi.boolean().optional()
});

// 5. LeaveType Schema
const leaveTypeSchema = Joi.object({
  name:        Joi.string().trim().required(),
  description: Joi.string().allow('').optional()
});

// 6. LeavePolicy Schema
const leavePolicySchema = Joi.object({
  employee_type_id: Joi.number().integer().required(),
  leave_type_id:    Joi.number().integer().required(),
  max_days_per_year: Joi.number().integer().required(),
  name:             Joi.string().trim().optional().allow(''),
  accrual_per_month: Joi.number().precision(2).required()
});

// 7. LeaveRequest Schema
const leaveRequestSchema = Joi.object({
  leave_type_id: Joi.number().integer().required(),
  start_date:    Joi.date().iso().required(),
  end_date:      Joi.date().iso().greater(Joi.ref('start_date')).required(),
  reason:        Joi.string().trim().optional().allow('')
});

// 8. LeaveBalance Schema
const leaveBalanceSchema = Joi.object({
  employee_id:   Joi.number().integer().required(),
  leave_type_id: Joi.number().integer().required(),
  year:          Joi.number().integer().min(2000).max(2100).required(),
  total_leave:   Joi.number().precision(2).required(),
  leaves_taken:  Joi.number().precision(2).optional().default(0)
});

// 9. ApprovalFlow Schema
const approvalFlowSchema = Joi.object({
  leave_id:        Joi.number().integer().required(),
  approver_id:     Joi.number().integer().required(),
  approval_status: Joi.string().valid('Pending','Approved','Rejected').required(),
  approved_at:     Joi.date().iso().optional(),
  status:          Joi.string().valid('In Progress','Completed','Skipped').default('In Progress'),
  comments:        Joi.string().trim().optional().allow('')
});

// 10. Holiday Schema (CalendarHolidays)
const holidaySchema = Joi.object({
  title:       Joi.string().trim().required(),
  date:        Joi.date().iso().required(),
  is_national: Joi.boolean().required(),
  is_floater:  Joi.boolean().optional().default(false)
});

// 11. Password Update Schema
const updatePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password:     Joi.string().min(6).required()
});

const validateBody = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ errors: error.details.map(d => d.message) });
  }
  next();
};

module.exports = {
  validateRegistration:   validateBody(registerSchema),
  validateLogin:          validateBody(loginSchema),
  validateEmployeeType:   validateBody(employeeTypeSchema),
  validateUpdateEmployee: validateBody(updateEmployeeSchema),
  validateLeaveType:      validateBody(leaveTypeSchema),
  validateLeavePolicy:    validateBody(leavePolicySchema),
  validateLeaveRequest:   validateBody(leaveRequestSchema),
  validateLeaveBalance:   validateBody(leaveBalanceSchema),
  validateApprovalFlow:   validateBody(approvalFlowSchema),
  validateHoliday:        validateBody(holidaySchema),
  validatePasswordUpdate: validateBody(updatePasswordSchema),
};
