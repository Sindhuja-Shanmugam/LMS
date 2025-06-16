const db = require('../db');


exports.createApprovalStages = async (leaveRequestId, leaveDays) => {
  console.log(`Creating approval stages for leaveRequestId=${leaveRequestId}, leaveDays=${leaveDays}`);

  try {
    // Determine approval stages based on leave days
    let stages = [];
    if (leaveDays <= 3) {
      stages.push('Manager');
    } else if (leaveDays >= 4 && leaveDays <= 7) {
      stages.push('Manager', 'HR');
    } else if (leaveDays > 7) {
      stages.push('Manager', 'HR', 'Director');
    }

    // Insert approval stages into the database
    for (const stage of stages) {
      console.log(`Inserting stage: ${stage}`);
      await db.execute(
        'INSERT INTO LeaveApprovalStage (leave_request_id, stage,status) VALUES (?, ?,?)',
        [leaveRequestId, stage,'Pending']
      );
    }
  } catch (error) {
    console.error("Error creating approval stages:", error);
    throw new Error('Error creating approval stages');
  }
};



// Get approver IDs based on employee type
exports.getApproverIdsByType = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT id, emp_type_id FROM employee 
      WHERE emp_type_id IN (2, 3, 4)
    `);

    const approvers = {};
    for (const row of rows) {
      if (row.emp_type_id === 2) approvers['Manager'] = row.id;
      if (row.emp_type_id === 3) approvers['HR'] = row.id;
      if (row.emp_type_id === 4) approvers['Director'] = row.id;
    }

    console.log('Fetched approvers:', approvers);
    return approvers;

  } catch (err) {
    console.error('Error fetching approver IDs:', err);
    return {};
  }
};



//create approval steps
// Create only the first approval step based on leave days
exports.createApprovalSteps = async (leaveRequestId, leaveDays, approvers) => {
  console.log(`Creating approval steps for leaveRequestId=${leaveRequestId}, leaveDays=${leaveDays}`);
  console.log("Approvers:", approvers);

  try {
    let stage = 'Manager'; // Always start with Manager

    const approverId = approvers[stage];
    if (!approverId) {
      throw new Error(`No approver ID for stage: ${stage}`);
    }

    await db.execute(
      `INSERT INTO approval_steps 
       (leave_request_id, approver_id, status, approval_status) 
       VALUES (?, ?, 'pending', 'Pending')`,
      [leaveRequestId, approverId]
    );

    console.log(`Inserted first approval step: ${stage} (approver ID: ${approverId})`);
  } catch (error) {
    console.error('Error inserting approval step:', error);
    throw error;
  }
};

