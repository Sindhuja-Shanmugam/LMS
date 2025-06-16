const db = require('../db');

// Helper: fetch approval chain for an employee
async function getChain(employeeId) {
  const [[chain]] = await db3.execute(
    `SELECT 
       t.manager_id       AS direct_manager,
       hr.manager_id      AS hr_lead,
       dir.manager_id     AS director
     FROM team_members tm
     JOIN teams t ON tm.team_id = t.id
     LEFT JOIN teams hr ON t.manager_id = hr.manager_id
     LEFT JOIN teams dir ON hr.manager_id = dir.manager_id
     WHERE tm.user_id = ?`,
    [employeeId]
  );
  return chain;
}

// 1. Auto-credit earned leave monthly
exports.autoCreditLeaves = async (req, res) => {
  try {
    await db3.execute(`
      UPDATE leavebalance
      SET total_allocated = total_allocated + 1,
          remaining_days  = remaining_days  + 1
      WHERE leave_type_id IN (
        SELECT id FROM leave_types WHERE is_auto_credit = TRUE
      )
    `);
    res.json({ message: 'Monthly leave auto-credit applied.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to auto-credit leaves' });
  }
};

// 2. Submit a new leave request (computes duration)
exports.submitLeaveRequest = async (req, res) => {
  const user_id = req.user.id;
  const { leave_type_id, start_date, end_date, reason } = req.body;
  try {
    const [r] = await db3.execute(
      `INSERT INTO leaverequest
         (user_id, leave_type_id, start_date, end_date, duration, reason, status_id)
       VALUES (?, ?, ?, ?, DATEDIFF(?, ?)+1, ?, 1)`,
      [user_id, leave_type_id, start_date, end_date, end_date, start_date, reason]
    );
    res.status(201).json({ message: 'Leave request submitted', id: r.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Get authenticated user’s leave requests
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const [rows] = await db3.execute(
      `SELECT lr.*, ls.name AS status, lt.name AS leave_type
       FROM leaverequest lr
       JOIN leave_statuses ls ON lr.status_id = ls.id
       JOIN leave_types lt    ON lr.leave_type_id = lt.id
       WHERE lr.user_id = ?
       ORDER BY lr.applied_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Get pending approvals based on user’s role
exports.getPendingApprovals = async (req, res) => {
  try {
    const role   = req.user.role;
    const userId = req.user.id;
    let base = `
      SELECT lr.id, lr.user_id, lr.duration, u.name AS applicant, ls.name AS status
      FROM leaverequest lr
      JOIN users u ON lr.user_id = u.id
      JOIN leave_statuses ls ON lr.status_id = ls.id
      WHERE lr.status_id = 1
    `;

    let rows = [];
    if (role === 'Manager') {
      [rows] = await db3.execute(
        base + `
          AND lr.user_id IN (
            SELECT user_id
            FROM team_members
            WHERE team_id IN (
              SELECT id FROM teams WHERE manager_id = ?
            )
          )`,
        [userId]
      );
    } else if (role === 'HR') {
      const chain = await getChain(userId);
      [rows] = await db3.execute(
        base + `
          AND lr.user_id IN (
            SELECT user_id
            FROM team_members
            WHERE team_id IN (
              SELECT id FROM teams WHERE manager_id = ?
            )
          )`,
        [chain.direct_manager]
      );
    } else if (role === 'Director') {
      const chain = await getChain(userId);
      [rows] = await db3.execute(
        base + `
          AND lr.user_id IN (
            SELECT user_id
            FROM team_members
            WHERE team_id IN (
              SELECT id FROM teams WHERE manager_id = ?
            )
          )`,
        [chain.hr_lead]
      );
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Approve a leave request (multi-level based on duration)
exports.approveLeave = async (req, res) => {
  const { id } = req.params;
  const role   = req.user.role;

  try {
    const [[leave]] = await db3.execute(
      `SELECT * FROM leave_requests WHERE id = ?`,
      [id]
    );
    if (!leave) return res.status(404).json({ message: 'Not found' });

    const chain = await getChain(leave.user_id);
    let nextApprover = null;
    let final = false;

    if (leave.duration <= 3) {
      // Manager only
      if (role !== 'Manager') return res.status(403).end();
      final = true;
    } else if (leave.duration <= 7) {
      // Manager → HR
      if (role === 'Manager') nextApprover = chain.hr_lead;
      else if (role === 'HR') final = true;
      else return res.status(403).end();
    } else {
      // Manager → HR → Director
      if (role === 'Manager') nextApprover = chain.hr_lead;
      else if (role === 'HR') nextApprover = chain.director;
      else if (role === 'Director') final = true;
      else return res.status(403).end();
    }

    // Log approval
    await db3.execute(
      `INSERT INTO leave_approval_flows
         (leave_id, step_id, approver_id, status_id, approved_at)
       VALUES (?, ?, ?, 2, NOW())`,
      [id, role === 'Manager' ? 1 : role === 'HR' ? 2 : 3, req.user.id]
    );

    if (final) {
      // Finalize approval
      await db3.execute(
        `UPDATE leave_requests SET status_id = 2 WHERE id = ?`,
        [id]
      );
      // Update leave balance
      await db3.execute(
        `UPDATE leave_balances
         SET used_days = used_days + ?, remaining_days = remaining_days - ?
         WHERE user_id = ? AND leave_type_id = ? AND year = YEAR(NOW())`,
        [leave.duration, leave.duration, leave.user_id, leave.leave_type_id]
      );
    } else {
      // Still pending nextApprover
      await db3.execute(
        `UPDATE leave_requests SET status_id = 1 WHERE id = ?`,
        [id]
      );
      // TODO: send notification to nextApprover
    }

    res.json({ message: 'Leave approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Reject a leave request
exports.rejectLeave = async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;

  try {
    await db3.execute(
      `UPDATE leave_requests SET status_id = 3 WHERE id = ?`,
      [id]
    );
    await db3.execute(
      `INSERT INTO leave_approval_flows
         (leave_id, step_id, approver_id, status_id, approved_at, remarks)
       VALUES (?, 1, ?, 3, NOW(), ?)`,
      [id, req.user.id, remarks]
    );
    res.json({ message: 'Leave rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 7. Get leave balance for the authenticated user
exports.getLeaveBalance = async (req, res) => {
  try {
    const [rows] = await db3.execute(
      `SELECT lb.year, lt.name AS leave_type, lb.total_allocated,
              lb.used_days, lb.remaining_days
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.user_id = ?`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 8. Team calendar (employee-wise leaves for a given month)
exports.getTeamCalendar = async (req, res) => {
  const { month } = req.query; // format: 'YYYY-MM'
  try {
    const [rows] = await db3.execute(
      `SELECT u.name AS employee, lr.start_date, lr.end_date,
              lt.name AS leave_type, ls.name AS status
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_statuses ls ON lr.status_id   = ls.id
       JOIN leave_types lt    ON lr.leave_type_id = lt.id
       WHERE DATE_FORMAT(lr.start_date, '%Y-%m') = ? 
          OR DATE_FORMAT(lr.end_date,   '%Y-%m') = ?`,
      [month, month]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error generating calendar' });
  }
};



exports.getPendingApprovals = async (req, res) => {
  const approverId = req.user.id;

  try {
    const [rows] = await db.query(`
      SELECT 
  a.id AS approval_id,
  lr.id AS leave_id,
  e.name AS employee_name,
  lt.name AS leave_type,
  lr.start_date,
  lr.end_date,
  lr.requested_at, 
  a.approval_status,
  a.approved_at,
  a.comments
FROM approval_steps a
JOIN leaverequest lr ON lr.id = a.leave_request_id
JOIN employee e ON e.id = lr.employee_id
JOIN leavetype lt ON lt.id = lr.leave_type_id
WHERE a.approver_id = ? AND a.approval_status = 'Pending'
ORDER BY lr.requested_at DESC;

    `, [approverId]);

    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching pending approvals:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


