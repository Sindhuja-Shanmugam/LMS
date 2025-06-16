const db = require('../db');

// 1. Create or top‐up leave balance (Admin only)
exports.createLeaveBalance = async (req, res) => {
  const { employee_id, leave_type_id, year, total_leave, leaves_taken } = req.body;
  try {
    const [r] = await db.execute(
      `INSERT INTO LeaveBalance
         (employee_id, leave_type_id, year, total_leave, leaves_taken)
       VALUES (?, ?, ?, ?, ?)`,
      [employee_id, leave_type_id, year, total_leave, leaves_taken]
    );
    res.status(201).json({ message: 'Leave balance created', id: r.insertId });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Balance already exists for this year/type' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get leave balance for an employee (self or Admin/HR/Manager/Director)
exports.getLeaveBalanceByEmployee = async (req, res) => {
  const { id } = req.params;
  if (
    req.user.id !== +id &&
    !['Admin', 'HR', 'Manager', 'Director'].includes(req.user.emp_type)
  ) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const [rows] = await db.execute(
      `SELECT lb.id, lt.name AS leave_type, lb.year,
              lb.total_leave, lb.leaves_taken
       FROM LeaveBalance lb
       JOIN LeaveType lt ON lb.leave_type_id = lt.id
       WHERE lb.employee_id = ?`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Update leave balance (Admin only)
exports.updateLeaveBalance = async (req, res) => {
  const { id } = req.params;
  const { total_leave, leaves_taken } = req.body;
  try {
    await db.execute(
      `UPDATE LeaveBalance
       SET total_leave = ?, leaves_taken = ?
       WHERE id = ?`,
      [total_leave, leaves_taken, id]
    );
    res.json({ message: 'Leave balance updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Delete leave balance (Admin only)
exports.deleteLeaveBalance = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute(`DELETE FROM LeaveBalance WHERE id = ?`, [id]);
    res.json({ message: 'Leave balance deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Auto‐credit earned leaves monthly (Admin only)
exports.autoCreditLeaves = async (req, res) => {
  try {
    await db.execute(`
      UPDATE LeaveBalance lb
      JOIN LeavePolicy lp
        ON lb.leave_type_id = lp.leave_type_id
       AND lb.year = YEAR(CURDATE())
      SET lb.total_leave = lb.total_leave + lp.accrual_per_month
      WHERE lp.accrual_per_month > 0
    `);
    res.json({ message: 'Monthly leave accrual applied.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Carry forward unused leave at year‐end (Admin only)
exports.carryForwardLeaves = async (req, res) => {
  try {
    await db.execute(`
      INSERT INTO LeaveBalance (employee_id, leave_type_id, year, total_leave, leaves_taken)
      SELECT employee_id, leave_type_id, YEAR(CURDATE())+1,
             LEAST(total_leave - leaves_taken, 5), 0
      FROM LeaveBalance
      WHERE year = YEAR(CURDATE())
    `);
    res.json({ message: 'Carry‐forward applied.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
