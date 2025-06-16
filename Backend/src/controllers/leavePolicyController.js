const db = require('../db');

exports.createLeavePolicy = async (req, res) => {
  const {
    employee_type_id,
    leave_type_id,
    max_days_per_year,
    name,
    accrual_per_month
  } = req.body;
  try {
    const [r] = await db.execute(
      `INSERT INTO LeavePolicy
         (employee_type_id, leave_type_id, max_days_per_year, name, accrual_per_month)
       VALUES (?, ?, ?, ?, ?)`,
      [employee_type_id, leave_type_id, max_days_per_year, name, accrual_per_month]
    );
    res.status(201).json({ message: 'Leave policy created', id: r.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLeavePolicies = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT lp.id, et.name AS employee_type, lt.name AS leave_type,
             lp.max_days_per_year, lp.name, lp.accrual_per_month
      FROM LeavePolicy lp
      JOIN EmployeeType et ON lp.employee_type_id = et.id
      JOIN LeaveType lt ON lp.leave_type_id = lt.id
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLeavePolicy = async (req, res) => {
  const { id } = req.params;
  const {
    employee_type_id,
    leave_type_id,
    max_days_per_year,
    name,
    accrual_per_month
  } = req.body;
  try {
    await db.execute(
      `UPDATE LeavePolicy
       SET employee_type_id = ?, leave_type_id = ?, max_days_per_year = ?, name = ?, accrual_per_month = ?
       WHERE id = ?`,
      [employee_type_id, leave_type_id, max_days_per_year, name, accrual_per_month, id]
    );
    res.json({ message: 'Leave policy updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteLeavePolicy = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute(`DELETE FROM LeavePolicy WHERE id = ?`, [id]);
    res.json({ message: 'Leave policy deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
