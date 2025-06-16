const db = require('../db');
const { getApproverIdsByType, createApprovalSteps } = require('../services/approvalService');
const { log, err } = require("../utils/logger");

const STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

exports.getAllLeaveRequests = async (req, res) => {
  try {
    const [leaveRequests] = await db.execute('SELECT * FROM LeaveRequest');
    res.status(200).json(leaveRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching leave requests', error });
  }
};

exports.getLeaveRequestsByEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.id !== parseInt(id) && !req.user.roles.includes('Admin') && !req.user.roles.includes('HR') && !req.user.roles.includes('Manager') && !req.user.roles.includes('Director')) {
      return res.status(403).json({ message: 'You do not have permission to view this employee\'s leave requests.' });
    }

    const [leaveRequests] = await db.execute('SELECT * FROM LeaveRequest WHERE employee_id = ?', [id]);
    res.status(200).json(leaveRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching leave requests for employee', error });
  }
};

exports.updateLeaveRequest = async (req, res) => {
  const { id } = req.params;
  const employeeId = req.user.id;
  const { leaveTypeId, startDate, endDate, reason, status } = req.body;

  try {
    const [existingLeaveRequest] = await db.execute('SELECT * FROM LeaveRequest WHERE id = ?', [id]);

    if (existingLeaveRequest.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (existingLeaveRequest[0].employee_id !== employeeId || existingLeaveRequest[0].status !== STATUS.PENDING) {
      return res.status(403).json({ message: 'You can only update your own pending leave requests' });
    }

    await db.execute(
      'UPDATE LeaveRequest SET leave_type_id = ?, start_date = ?, end_date = ?, reason = ?, status = ? WHERE id = ?',
      [leaveTypeId, startDate, endDate, reason, status, id]
    );

    const [updatedLeaveRequest] = await db.execute('SELECT * FROM LeaveRequest WHERE id = ?', [id]);
    res.status(200).json(updatedLeaveRequest[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating leave request', error });
  }
};


exports.deleteLeaveRequest = async (req, res) => {
  const { id } = req.params;
  const employeeId = req.user.id;
  const STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
  try {
    const [existingLeaveRequest] = await db.execute('SELECT * FROM LeaveRequest WHERE id = ?', [id]);

    if (existingLeaveRequest.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const leave = existingLeaveRequest[0];

    if (leave.employee_id !== employeeId || leave.status !== STATUS.PENDING) {
      return res.status(403).json({ message: 'You can only delete your own pending leave requests' });
    }

    // Delete approval steps first
    await db.execute('DELETE FROM approval_steps WHERE leave_request_id = ?', [id]);

    // Then delete the main leave request
    await db.execute('DELETE FROM LeaveRequest WHERE id = ?', [id]);
    log(fn, "Leave request deleted", id);
    res.status(200).json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    err(fn, "Error deleting leave request", error);
    res.status(500).json({ message: 'Error deleting leave request', error });
  }
};


exports.createLeaveRequest = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { leave_type_id, start_date, end_date, reason } = req.body;

    if (!leave_type_id || !start_date || !end_date || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ message: 'Start date cannot be after end date' });
    }

    const [holidayRows] = await db.execute(
      'SELECT holiday_date FROM Holiday WHERE holiday_date BETWEEN ? AND ?',
      [start_date, end_date]
    );

    if (holidayRows.length > 0) {
      return res.status(400).json({ message: 'Leave request includes holidays', holidays: holidayRows });
    }

    const [employeeRows] = await db.execute('SELECT manager_id FROM Employee WHERE id = ?', [employeeId]);
    if (!employeeRows.length || !employeeRows[0].manager_id) {
      return res.status(404).json({ message: 'Manager not assigned to employee' });
    }

    const managerId = employeeRows[0].manager_id;
    const leaveDays = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1;

    const [result] = await db.execute(
      'INSERT INTO LeaveRequest (employee_id, manager_id, leave_type_id, start_date, end_date, reason, status, requested_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [employeeId, managerId, leave_type_id, start_date, end_date, reason, STATUS.PENDING]
    );

    const leaveRequestId = result.insertId;
    const approvers = await getApproverIdsByType();
    await createApprovalSteps(leaveRequestId, leaveDays, approvers);

    const [newLeaveRequest] = await db.execute('SELECT * FROM LeaveRequest WHERE id = ?', [leaveRequestId]);
    log(fn, "Leave request submitted", { employee_id, leave_type_id });
    res.status(201).json({ message: 'Leave request created successfully', leaveRequest: newLeaveRequest[0] });
  } catch (error) {
    err(fn, "Error submitting leave request", error);
    res.status(500).json({ message: 'Error creating leave request', error: error.message });
  }
};

exports.updateApprovalStage = async (req, res) => {
  const { id } = req.params;
  const { status, comments } = req.body;
  const approverId = req.user.id;

  if (!['approve', 'reject'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Use "approve" or "reject".' });
  }

  const STATUS = { APPROVED: 'Approved', REJECTED: 'Rejected' };

  try {
    const [steps] = await db.execute(
      `SELECT aps.*, e.emp_type_id 
       FROM approval_steps aps 
       JOIN employee e ON aps.approver_id = e.id 
       WHERE aps.leave_request_id = ? 
       ORDER BY aps.id ASC`,
      [id]
    );

    if (!steps.length) {
      return res.status(404).json({ message: 'No approval steps found for this leave request.' });
    }

    const currentStep = steps.find(s => s.approver_id === approverId && s.status === 'pending');
    if (!currentStep) {
      return res.status(403).json({ message: 'Not authorized or step already processed.' });
    }

    const index = steps.findIndex(s => s.id === currentStep.id);
    const previousSteps = steps.slice(0, index);
    if (previousSteps.find(s => s.status !== 'approved')) {
      return res.status(400).json({ message: 'Previous steps not yet approved.' });
    }

    // Update the current approval step
    await db.execute(
      'UPDATE approval_steps SET status = ?, approved_at = NOW(), comments = ? WHERE id = ?',
      [status === 'approve' ? 'approved' : 'rejected', comments?.trim() || null, currentStep.id]
    );

    // If rejected, update leave request and exit
    if (status === 'reject') {
      await db.execute('UPDATE leaverequest SET status = ? WHERE id = ?', [STATUS.REJECTED, id]);
      return res.status(200).json({ message: 'Leave request rejected.' });
    }

    // If no more pending steps, mark leave as approved and update balance
    const [remaining] = await db.execute(
      'SELECT * FROM approval_steps WHERE leave_request_id = ? AND status = "pending"',
      [id]
    );

    if (!remaining.length) {
      await db.execute('UPDATE leaverequest SET status = ? WHERE id = ?', [STATUS.APPROVED, id]);

      const [[leave]] = await db.execute(
        'SELECT employee_id, leave_type_id, start_date, end_date FROM leaverequest WHERE id = ?',
        [id]
      );

      if (leave) {
        const leaveDays =
          Math.floor((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1;
        const year = new Date().getFullYear();

        const [[balance]] = await db.execute(
          `SELECT total_leave, leaves_taken 
           FROM leavebalance 
           WHERE employee_id = ? AND leave_type_id = ? AND year = ?`,
          [leave.employee_id, leave.leave_type_id, year]
        );

        if (balance) {
          const available = balance.total_leave - balance.leaves_taken;
          if (leaveDays > available) {
            return res.status(400).json({ message: 'Insufficient leave balance.' });
          }

          await db.execute(
            `UPDATE leavebalance 
             SET leaves_taken = leaves_taken + ? 
             WHERE employee_id = ? AND leave_type_id = ? AND year = ?`,
            [leaveDays, leave.employee_id, leave.leave_type_id, year]
          );
        }
      }

      return res.status(200).json({ message: 'Leave fully approved and balance updated.' });
    }

    res.status(200).json({ message: 'Step approved. Awaiting next approver.' });
  } catch (error) {
    console.error('Error updating approval stage:', error);
    res.status(500).json({ message: 'Error updating approval stage', error: error.message });
  }
};


exports.getApprovalStatus = async (req, res) => {
  const { leaveRequestId } = req.params;
  try {
    const [rows] = await db.execute(`
      SELECT s.step_order, s.status, s.approval_status, s.approved_at AS decision_date, s.comments,
             e.name AS approver_name, et.name AS approver_role
      FROM approval_steps s
      JOIN employee e ON s.approver_id = e.id
      JOIN employeeType et ON e.emp_type_id = et.id
      WHERE s.leave_request_id = ?
      ORDER BY s.step_order ASC
    `, [leaveRequestId]);

    if (!rows.length) {
      return res.status(404).json({ message: 'No approval steps found for this request' });
    }

    res.json({ leaveRequestId, approvalSteps: rows });
  } catch (error) {
    console.error('Error fetching approval status:', error);
    res.status(500).json({ message: 'Error retrieving approval status', error: error.message });
  }
};


exports.getMyLeaveRequests = async (req, res) => {
  const employeeId = req.user.id;

  try {
    const [rows] = await db.execute(
      `SELECT lr.*, lt.name AS leave_type FROM LeaveRequest lr
       JOIN LeaveType lt ON lr.leave_type_id = lt.id
       WHERE lr.employee_id = ?
       ORDER BY lr.requested_at DESC`,
      [employeeId]
    );
    log(fn, "Fetched leave requests", rows.length);
    res.status(200).json(rows);
  } catch (err) {
    err(fn, "Error fetching leave requests", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
