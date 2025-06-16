const db = require('../db');
const bcrypt = require('bcryptjs');
const { log, err } = require("../utils/logger");

// Create Employee (Admin only)
exports.createEmployee = async (req, res) => {
  const { name, email, password, emp_type_id, manager_id } = req.body;
  const conn = await db.getConnection(); // Use transaction-safe connection

  try {
    await conn.beginTransaction();

    // 1. Hash password
    const hash = await bcrypt.hash(password, 10);

    // 2. Insert employee
    const [empResult] = await conn.execute(
      `INSERT INTO Employee
         (name, email, password_hash, emp_type_id, manager_id, created_at, is_active)
       VALUES (?, ?, ?, ?, ?, NOW(), TRUE)`,
      [name, email, hash, emp_type_id, manager_id]
    );
    const newEmpId = empResult.insertId;
    console.log('Employee created with ID:', newEmpId);
    // 3. Fetch Leave Policies for this employee type
    const [policies] = await conn.execute(
      `SELECT leave_type_id, max_days_per_year
       FROM LeavePolicy
       WHERE employee_type_id = ?`,
      [emp_type_id]
    );
    // If no leave policies exist for this employee type, return an error
    if (policies.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'No leave policies found for this employee type' });
    }

    console.log('Leave policies found for employee type:', policies);

    const currentYear = new Date().getFullYear();
    // 4. Insert Leave Balances for each leave type (for the current year)
    for (const policy of policies) {

       await conn.execute(
        `INSERT INTO LeaveBalance
           (employee_id, leave_type_id, year, total_leave, leaves_taken)
         VALUES (?, ?, ?, ?, ?)`,
        [newEmpId, policy.leave_type_id, currentYear, policy.max_days_per_year, 0]
      );

    }
    // Commit the transaction
    await conn.commit();
    log(fn, "Employee created successfully", { id: employee_id, name });
    res.status(201).json({ message: 'Employee created with leave balance', id: newEmpId });

  } catch (e) {
    await conn.rollback();
    err(fn, "Error creating employee", error);
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

// Get All Employees (Admin/HR) with pagination
exports.getAllEmployees = async (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '10');
  const offset = (page - 1) * limit;

  try {
    const [[{ total }]] = await db.execute(`SELECT COUNT(*) AS total FROM Employee`);
    const [rows] = await db.execute(
      `SELECT e.id, e.name, e.email, et.name AS emp_type,
              e.manager_id, e.created_at, e.is_active
       FROM Employee e
       JOIN EmployeeType et ON e.emp_type_id = et.id
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    log(fn, "Fetched all employees", rows.length);
    res.json({ page, limit, total, data: rows });
  } catch (e) {
    err(fn, "Error fetching employees", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Employee by ID (self or Admin/HR)
exports.getEmployeeById = async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== +id && !['Admin', 'HR'].includes(req.user.emp_type)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const [[emp]] = await db.execute(
     `SELECT 
         e.id, e.name, e.email, et.name AS emp_type,
         e.manager_id, e.created_at, e.is_active,
         m.name AS manager_name, mt.name AS manager_role
       FROM Employee e
       JOIN EmployeeType et ON e.emp_type_id = et.id
       LEFT JOIN Employee m ON e.manager_id = m.id
       LEFT JOIN EmployeeType mt ON m.emp_type_id = mt.id
       WHERE e.id = ?`,
      [id]
    );
    if (!emp) return res.status(404).json({ message: 'Not found' });
    //log(fn, "Fetched employee", rows[0]);
    res.json(emp);
  } catch (e) {
    //err(fn, "Error fetching employee", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Employee (self or Admin/HR)
exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== +id && !['Admin', 'HR'].includes(req.user.emp_type)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const { name, email, emp_type_id, manager_id, is_active } = req.body;
  try {
    await db.execute(
      `UPDATE Employee
       SET name = ?, email = ?, emp_type_id = ?, manager_id = ?, is_active = ?
       WHERE id = ?`,
      [name, email, emp_type_id, manager_id, is_active, id]
    );
    log(fn, "Employee updated", id);
    res.json({ message: 'Employee updated' });
  } catch (e) {
    err(fn, "Error updating employee", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Employee (Admin only)
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute(`DELETE FROM Employee WHERE id = ?`, [id]);
    res.json({ message: 'Employee deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change Password (self)
exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const [[user]] = await db.execute(
      `SELECT password_hash FROM Employee WHERE id = ?`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ message: 'Not found' });
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(400).json({ message: 'Current password incorrect' });
    const newHash = await bcrypt.hash(new_password, 10);
    await db.execute(
      `UPDATE Employee SET password_hash = ? WHERE id = ?`,
      [newHash, req.user.id]
    );
    res.json({ message: 'Password changed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getTeamMembers = async (req, res) => {
  const managerId = req.user.id;
 console.log("Manager ID from token:", managerId);
  try {
    const [team] = await db.execute(
      `SELECT id, name, email, emp_type_id FROM employee WHERE manager_id = ? AND is_active = 1`,
      [managerId]
    );

    res.status(200).json(team);
  } catch (error) {
    console.error("getTeamMembers error:", error);
    res.status(500).json({ message: "Error fetching team members" });
  }
};
