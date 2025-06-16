// /controllers/approvalController.js
const pool = require('../db');

exports.getPendingApprovals = async (req, res) => {
  // Route: GET /approvals/pending
  // Only Manager or HR should reach here (use isManager middleware).
  const approverId = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT aps.id AS approval_step_id,
              aps.leave_request_id,
              lr.employee_id,
              e.name AS employee_name,
              lr.leave_type_id,
              lt.name AS leave_type_name,
              lr.start_date,
              lr.end_date,
              lr.number_of_days,
              lr.reason,
              aps.step_order
         FROM ApprovalSteps aps
         JOIN LeaveRequest lr ON lr.id = aps.leave_request_id
         JOIN Employee e ON e.id = lr.employee_id
         JOIN LeaveType lt ON lt.id = lr.leave_type_id
        WHERE aps.approver_id = ? 
          AND aps.status = 'Pending'
        ORDER BY aps.created_at ASC`,
      [approverId]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching pending approvals' });
  }
};

exports.approveStep = async (req, res) => {
  /**
   * Route: POST /approvals/:stepId/approve
   * Body: { remarks: '...' }
   * Only Manager/HR can call this (use isManager).
   */
  const approverId = req.user.id;
  const stepId = req.params.stepId;
  const { remarks } = req.body;

  try {
    // 1) Fetch this ApprovalSteps row, join in LeaveRequest to get everything we need
    const [rows] = await pool.query(
      `SELECT aps.leave_request_id,
              aps.step_order,
              lr.employee_id,
              lr.leave_type_id,
              lr.number_of_days
         FROM ApprovalSteps aps
         JOIN LeaveRequest lr ON lr.id = aps.leave_request_id
        WHERE aps.id = ? 
          AND aps.approver_id = ? 
          AND aps.status = 'Pending'`,
      [stepId, approverId]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'No pending approval step found for you' });

    const { leave_request_id, step_order, employee_id, leave_type_id, number_of_days } = rows[0];

    // 2) Mark this step as 'Approved'
    await pool.query(
      `UPDATE ApprovalSteps
          SET status = 'Approved',
              decision_date = NOW(),
              remarks = ?
        WHERE id = ?`,
      [remarks || null, stepId]
    );

    // 3) Check if there's a next step
    const [nextRows] = await pool.query(
      `SELECT id 
         FROM ApprovalSteps
        WHERE leave_request_id = ? 
          AND step_order = ? + 1`,
      [leave_request_id, step_order]
    );

    if (nextRows.length) {
      // 3a) Activate the next step
      const nextStepId = nextRows[0].id;
      await pool.query(
        `UPDATE ApprovalSteps
            SET status = 'Pending'
          WHERE id = ?`,
        [nextStepId]
      );

      // Optionally notify the next approver
      // const [{approver_id}] = await pool.query(`SELECT approver_id FROM ApprovalSteps WHERE id = ?`, [nextStepId]);
      // sendNotification(approver_id, `Leave #${leave_request_id} is awaiting your approval.`);

      return res.json({ message: 'Step approved, moved to next approver.' });
    } else {
      // 3b) This was the final step. Mark LeaveRequest as 'Approved'
      await pool.query(
        `UPDATE LeaveRequest
            SET status = 'Approved',
                approval_date = NOW()
          WHERE id = ?`,
        [leave_request_id]
      );

      // 4) Deduct days from LeaveBalance.leaves_taken
      const [balanceRows] = await pool.query(
        `SELECT id, leaves_taken 
           FROM LeaveBalance
          WHERE employee_id = ? 
            AND leave_type_id = ? 
            AND year = ?`,
        [employee_id, leave_type_id, new Date().getFullYear()]
      );
      if (!balanceRows.length)
        return res.status(500).json({ message: 'LeaveBalance not found to deduct from' });

      const balanceId = balanceRows[0].id;
      const newLeavesTaken = parseFloat(balanceRows[0].leaves_taken) + parseFloat(number_of_days);

      await pool.query(
        `UPDATE LeaveBalance
            SET leaves_taken = ?
          WHERE id = ?`,
        [newLeavesTaken, balanceId]
      );

      // (Optional) Insert into LeaveBalanceHistory for audit
      // await pool.query(
      //   `INSERT INTO LeaveBalanceHistory (balance_id, change_type, change_amount, notes, created_at)
      //    VALUES (?, 'deduction', ?, ?, NOW())`,
      //   [balanceId, number_of_days, `LeaveRequest #${leave_request_id} approved`]
      // );

      // Notify the employee
      // sendNotification(employee_id, `Your leave request #${leave_request_id} has been approved.`);

      return res.json({ message: 'Leave fully approved and balance updated.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error approving this step' });
  }
};

exports.rejectStep = async (req, res) => {
  /**
   * Route: POST /approvals/:stepId/reject
   * Body: { remarks: 'Reason for rejection' }
   * Only Manager/HR can call this.
   */
  const approverId = req.user.id;
  const stepId = req.params.stepId;
  const { remarks } = req.body;

  try {
    // 1) Fetch the pending step (to get leave_request_id)
    const [rows] = await pool.query(
      `SELECT leave_request_id 
         FROM ApprovalSteps 
        WHERE id = ? 
          AND approver_id = ? 
          AND status = 'Pending'`,
      [stepId, approverId]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'No pending approval step found for you' });

    const leaveRequestId = rows[0].leave_request_id;

    // 2) Mark this step as 'Rejected'
    await pool.query(
      `UPDATE ApprovalSteps 
          SET status = 'Rejected', 
              decision_date = NOW(), 
              remarks = ?
        WHERE id = ?`,
      [remarks || null, stepId]
    );

    // 3) Mark LeaveRequest as 'Rejected'
    await pool.query(
      `UPDATE LeaveRequest 
          SET status = 'Rejected', 
              approval_date = NOW() 
        WHERE id = ?`,
      [leaveRequestId]
    );

    // 4) Cancel any downstream steps (Pending or Inactive)
    await pool.query(
      `UPDATE ApprovalSteps
          SET status = 'Cancelled'
        WHERE leave_request_id = ? 
          AND status IN ('Pending', 'Inactive')`,
      [leaveRequestId]
    );

    // Notify the employee
    // sendNotification(employee_id, `Your leave request #${leaveRequestId} was rejected.`);

    return res.json({ message: 'Leave request rejected and downstream steps cancelled.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error rejecting this step' });
  }
};
