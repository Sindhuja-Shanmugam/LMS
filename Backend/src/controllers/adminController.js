const db2 = require('../db');

// 1. Leave Types CRUD
exports.createLeaveType = async (req, res) => {
  const { name, is_paid, default_days } = req.body;
  try {
    const [result] = await db2.execute(
      `INSERT INTO leave_types (name, is_paid, default_days)
       VALUES (?, ?, ?)`,
      [name, is_paid, default_days]
    );
    res.status(201).json({ message: 'Leave type created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getAllLeaveTypes = async (req, res) => {
  try {
    const [rows] = await db2.query(`SELECT * FROM leave_types`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.updateLeaveType = async (req, res) => {
  const { id } = req.params;
  const { name, is_paid, default_days } = req.body;
  try {
    await db2.execute(
      `UPDATE leave_types SET name = ?, is_paid = ?, default_days = ? WHERE id = ?`,
      [name, is_paid, default_days, id]
    );
    res.json({ message: 'Leave type updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.deleteLeaveType = async (req, res) => {
  const { id } = req.params;
  try {
    await db2.execute(`DELETE FROM leave_types WHERE id = ?`, [id]);
    res.json({ message: 'Leave type deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Holidays CRUD
exports.createHoliday = async (req, res) => {
  const { title, date, is_national } = req.body;
  try {
    const [result] = await db2.execute(
      `INSERT INTO calendar_holidays (title, date, is_national)
       VALUES (?, ?, ?)`,
      [title, date, is_national]
    );
    res.status(201).json({ message: 'Holiday created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getHolidays = async (req, res) => {
  try {
    const [rows] = await db2.query(`SELECT * FROM calendar_holidays`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.deleteHoliday = async (req, res) => {
  const { id } = req.params;
  try {
    await db2.execute(`DELETE FROM calendar_holidays WHERE id = ?`, [id]);
    res.json({ message: 'Holiday deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Approval Steps
exports.create_approval_steps = async (req, res) => {
  const { min_days, max_days, approver_role_id, sequence } = req.body;
  try {
    const [result] = await db2.execute(
      `INSERT INTO approval_steps (min_days, max_days, approver_role_id, sequence)
       VALUES (?, ?, ?, ?)`,
      [min_days, max_days, approver_role_id, sequence]
    );
    res.status(201).json({ message: 'Approval step created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getApprovalSteps = async (req, res) => {
  try {
    const [rows] = await db2.query(`SELECT * FROM approval_steps`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.delete_approval_steps = async (req, res) => {
  const { id } = req.params;
  try {
    await db2.execute(`DELETE FROM approval_steps WHERE id = ?`, [id]);
    res.json({ message: 'Approval step deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Departments CRUD
exports.create_Departments = async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await db2.execute(
      `INSERT INTO departments (name) VALUES (?)`,
      [name]
    );
    res.status(201).json({ message: 'Department created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getDepartment = async (req, res) => {
  try {
    const [rows] = await db2.query(`SELECT * FROM departments`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.delete_Department = async (req, res) => {
  const { id } = req.params;
  try {
    await db2.execute(`DELETE FROM departments WHERE id = ?`, [id]);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Roles CRUD
exports.create_Roles = async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await db2.execute(`INSERT INTO roles (name) VALUES (?)`, [name]);
    res.status(201).json({ message: 'New role created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getRoles = async (req, res) => {
  try {
    const [rows] = await db2.query(`SELECT * FROM roles`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.delete_Roles = async (req, res) => {
  const { id } = req.params;
  try {
    await db2.execute(`DELETE FROM roles WHERE id = ?`, [id]);
    res.json({ message: 'Role deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Leave Statuses CRUD
exports.create_leaveStatuses = async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await db2.execute(`INSERT INTO leave_statuses (name) VALUES (?)`, [name]);
    res.status(201).json({ message: 'New leave status created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getLeaveStatuses = async (req, res) => {
  try {
    const [rows] = await db2.query(`SELECT * FROM leave_statuses`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.delete_LeaveStatuses = async (req, res) => {
  const { id } = req.params;
  try {
    await db2.execute(`DELETE FROM leave_statuses WHERE id = ?`, [id]);
    res.json({ message: 'Leave status deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
