// React component to show pending leave requests for approvers (manager/hr/director)
import React, { useEffect, useState } from "react";
import { Button, Table } from "react-bootstrap";

const Home = () => {
  const [employee, setEmployee] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchEmployee();
  }, []);

  useEffect(() => {
    if (employee?.id) {
      fetchPendingApprovals();
    }
  }, [employee]);

  const fetchEmployee = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/v1/employees/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEmployee(data);
    } catch (err) {
      console.error("Failed to fetch employee data", err);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/v1/leave-approvals/pending/${employee.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setPendingApprovals(data);
    } catch (err) {
      console.error("Failed to fetch approvals", err);
    }
  };

  const handleAction = async (approvalStepId, action) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/v1/leave-approvals/action/${approvalStepId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        }
      );

      if (res.ok) {
        alert(`Leave ${action.toLowerCase()}ed successfully`);
        setPendingApprovals(
          pendingApprovals.filter((item) => item.approval_step_id !== approvalStepId)
        );
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      alert("Error occurred while updating");
    }
  };

  return (
    <div className="p-4">
      <h3>Welcome, {employee?.name}</h3>
      <p>Email: {employee?.email}</p>
      <p>Role: {employee?.emp_type}</p>

      <h4 className="mt-4">Pending Leave Approvals</h4>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Employee</th>
            <th>Type</th>
            <th>Start</th>
            <th>End</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Stage</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingApprovals.length === 0 ? (
            <tr>
              <td colSpan="9" className="text-center">
                No pending approvals
              </td>
            </tr>
          ) : (
            pendingApprovals.map((req, idx) => (
              <tr key={req.approval_step_id}>
                <td>{idx + 1}</td>
                <td>{req.employee_name}</td>
                <td>{req.leave_type}</td>
                <td>{req.start_date}</td>
                <td>{req.end_date}</td>
                <td>{req.reason}</td>
                <td>{req.status}</td>
                <td>{req.stage}</td>
                <td>
                  <Button
                    variant="success"
                    size="sm"
                    className="me-2"
                    onClick={() => handleAction(req.approval_step_id, "Approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleAction(req.approval_step_id, "Rejected")}
                  >
                    Reject
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default Home;
