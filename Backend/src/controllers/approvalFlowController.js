const db = require('../db');

// 1. Create approval flow entry (Manager/HR/Director/Admin)
exports.createApprovalFlow = async (req, res) => {
  const { leave_id, approver_id, approval_status, approved_at, status, comments } = req.body;
  try {
    const [r] = await db.execute(
      `INSERT INTO ApprovalFlow
         (leave_id, approver_id, approval_status, approved_at, status, comments)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [leave_id, approver_id, approval_status, approved_at, status, comments]
    );
    res.status(201).json({ message: 'Approval flow entry created', id: r.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get approval flow entries for a given leave (Manager/HR/Director/Admin)
exports.getApprovalFlowByLeave = async (req, res) => {
  const { leaveId } = req.params;
  if (!['Admin', 'Manager', 'HR', 'Director'].includes(req.user.emp_type)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const [rows] = await db.execute(
      `SELECT af.id, af.approver_id, e.name AS approver_name,
              af.approval_status, af.approved_at, af.status, af.comments
       FROM ApprovalFlow af
       JOIN Employee e ON af.approver_id = e.id
       WHERE af.leave_id = ?`,
      [leaveId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Update an approval flow entry (only Manager/HR/Director)
exports.updateApprovalFlow = async (req, res) => {
  const { id } = req.params;
  const { approval_status, approved_at, status, comments } = req.body;
  if (!['Manager', 'HR', 'Director'].includes(req.user.emp_type)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    await db.execute(
      `UPDATE ApprovalFlow
       SET approval_status = ?, approved_at = ?, status = ?, comments = ?
       WHERE id = ?`,
      [approval_status, approved_at, status, comments, id]
    );
    res.json({ message: 'Approval flow updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Delete an approval flow entry (Admin only)
exports.deleteApprovalFlow = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute(`DELETE FROM ApprovalFlow WHERE id = ?`, [id]);
    res.json({ message: 'Approval flow entry deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// 1. Get pending leave requests for logged-in manager
exports.getPendingApprovals = async (req, res) => {
  const approverId = req.params.approverId;

  const [results] = await db.query(`
    SELECT s.id, s.leave_request_id, s.status, e.name as employee_name,
           lr.start_date, lr.end_date, lr.reason, lt.name as leave_type
    FROM approval_steps s
    JOIN leave_requests lr ON s.leave_request_id = lr.id
    JOIN employees e ON lr.employee_id = e.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    WHERE s.approver_id = ? AND s.status = 'Pending'
  `, [approverId]);

  res.json(results);
};


