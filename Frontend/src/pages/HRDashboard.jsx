import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, Link } from "react-router-dom";
import axios from 'axios';
import jsPDF from "jspdf";
import team from "../context/teamData";
import Team from "../pages/Team";
import {
  FaHome,
  FaCalendarAlt,
  FaUsers,
  FaFileAlt,
  FaBook,
  FaSignOutAlt,
  FaBars,
} from "react-icons/fa";
import balance from "../context/leaveBalane";
import Calendar from "../pages/Calendar";

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [employee, setEmployee] = useState(null);
  const [events, setEvents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [managerId, setManagerId] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    start_date: "",
    end_date: "",
    type: "",
    reason: "",
  });
  const [leaveRequests, setLeaveRequest] = useState([]);
  const token = localStorage.getItem('token'); // or sessionStorage
  const decoded = token ? JSON.parse(atob(token.split('.')[1])) : null;
  console.log("Manager ID:", decoded?.id);
  const [employeeId, setEmployeeId] = useState(null);


const roleMap = {
  1: "Admin",
  2: "Manager",
  3: "HR",
  4: "Director",
  5: "Employee",
  6: "Intern",
  7:"VP",
};
  useEffect(() => {
    fetchEmployee();
  }, []);

  useEffect(() => {
    if (employeeId) {
      fetchLeaveEvents();
      fetchLeaveRequest();
      fetchManagerPendingRequests();
    }
  }, [employeeId]);

  const fetchEmployee = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/v1/employees/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch employee");
      const data = await res.json();
      setEmployee(data);
      setEmployeeId(data.id);
    } catch (error) {
      console.error("Error fetching employee", error);
      setEmployee(null);
    }
  };

  const fetchLeaveEvents = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/v1/leave-requests/employee/${employeeId}`
      );
      const data = await res.json();
      const formatted = data
        .filter((leave) => leave.status === "Approved")
        .map((leave) => ({
          title: `${leave.type} (${leave.status})`,
          start: leave.start_date,
          end: leave.end_date,
          color:
            leave.status === "Approved"
              ? "#28a745"
              : leave.status === "Pending"
              ? "#ffc107"
              : "#dc3545",
        }));
      setEvents(formatted);
    } catch (error) {
      console.error("Error fetching leave events", error);
    }
  };

  const fetchLeaveRequest=async()=>{
    try{
      const res=await fetch(`http://localhost:5000/api/v1/leave-requests/employee/${employeeId}`,
        {
          headers:{
            Authorization:`Bearer ${token}`,
          },
        }
      );
      const data=await res.json();
      setLeaveRequest(data);
    }catch(error){
      console.error("Error fetching leave requests",error);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this leave request?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:5000/api/v1/leave-requests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (res.ok) {
        alert("Leave request deleted successfully.");
        fetchLeaveRequests();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Error deleting leave request:", err);
    }
  };

 const fetchManagerPendingRequests = async () => {
  try {
    const res = await fetch(`http://localhost:5000/api/manager/pending-approvals`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Error fetching manager approvals:", data);
      setPendingApprovals([]);
    } else {
      setPendingApprovals(data);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
    setPendingApprovals([]);
  }
};

const handleApprove = async (leaveId) => {
  try {
    const res = await fetch(`http://localhost:5000/api/v1/leave-requests/approval/${leaveId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        status: "approve",
        comments: "Approved by manager." // You can make this dynamic with a textarea input
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      fetchManagerPendingRequests(); // Refresh the list
    } else {
      alert(data.message || "Approval failed");
    }
  } catch (error) {
    console.error("Approval error:", error);
    alert("Something went wrong");
  }
};

const handleReject = async (leaveId) => {
  try {
    const res = await fetch(`http://localhost:5000/api/v1/leave-requests/reject/${leaveId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        status: "reject",
        comments: "Not sufficient reason" // You can make this dynamic
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      fetchManagerPendingRequests(); // Refresh the list
    } else {
      alert(data.message || "Rejection failed");
    }
  } catch (error) {
    console.error("Rejection error:", error);
    alert("Something went wrong");
  }
};

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/v1/leave-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employee_id: employeeId, ...leaveForm }),
      });

      if (res.ok) {
        alert("Leave request submitted");
        setLeaveForm({ start_date: "", end_date: "", type: "", reason: "" });
        fetchEmployee();
        fetchLeaveEvents();
      } else {
        alert("Failed to submit leave");
      }
    } catch (err) {
      alert("Error while submitting leave");
    }
  };
console.log("Type:", employee?.emp_type);  
console.log("Pending Approvals:", pendingApprovals);


const downloadPDF = () => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Leave Policy", 10, 10);

  doc.setFontSize(12);
  const policyText = `
1. Types of Leave
- Casual Leave (CL): 8 days annually
- Sick Leave (SL): 10 days annually
- Earned Leave (EL): 15 days annually
- Maternity Leave: 26 weeks (for women employees)
- Paternity Leave: 7 days
- Floating Leave: 2 days annually

2. Leave Accrual & Carry Forward
- Earned Leave: Can carry forward up to 30 days
- Casual & Sick Leave: Cannot be carried forward

3. Leave Application & Approval
- Leave must be applied in advance
- Emergency leaves can be informed via call/email
- Approval Flow:
  * 1 to 3 days: Manager
  * 4 to 7 days: Manager → HR
  * 8+ days: Manager → HR → Director

4. General Guidelines
- Unauthorized absence = Loss of pay
- Repeated violations may lead to disciplinary action
- All approved leaves are recorded
`;

  const lines = doc.splitTextToSize(policyText, 180);
  doc.text(lines, 10, 20);
  doc.save("LeavePolicy.pdf");
};




  const renderContent = () => {
    switch (activeTab) {
      case "home":
  return (
    <div className="p-4">
      <h3>Welcome, {employee?.name}</h3>

      {/* Row: Left = Details, Right = Leave Balance */}
      <div className="row">
        {/* Left Column: Employee Details */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h4 className="card-title mb-3 text-primary">👤 Employee Details</h4>
              <p><strong>Name:</strong> {employee?.name}</p>
              <p><strong>Email:</strong> {employee?.email}</p>
              <p><strong>Role:</strong> {employee?.emp_type}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Leave Balance */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h4 className="card-title mb-3 text-success">🗓️ Leave Balance</h4>
              <div className="table-responsive">
                <table className="table table-bordered mb-0 table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Type</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Sick</td><td>{balance.sick ?? 4}</td></tr>
                    <tr><td>Casual</td><td>{balance.casual ?? 6}</td></tr>
                    <tr><td>Paid</td><td>{balance.paid ?? 8}</td></tr>
                    <tr><td>Loss of pay</td><td>{balance.lop ?? 0}</td></tr>
                    <tr><td>Floating</td><td>{balance.floating ?? 5}</td></tr>
                    <tr><td>Maternity</td><td>{balance.maternity ?? 0}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Section */}
      {employee?.emp_type === "Manager" && pendingApprovals.length > 0 && (
        <>
          <h4 className="mt-4">Pending Leave Requests for Approval</h4>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Requested At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map((req, idx) => (
                  <tr key={req.leave_id}>
                    <td>{idx + 1}</td>
                    <td>{req.employee_name}</td>
                    <td>{req.start_date}</td>
                    <td>{req.end_date}</td>
                    <td>{req.leave_type}</td>
                    <td>{req.reason}</td>
                    <td>
                      <span className="badge bg-warning text-dark">{req.status}</span>
                    </td>
                    <td>{req.requested_at ? new Date(req.requested_at).toLocaleString() : "N/A"}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => handleApprove(req.leave_id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleReject(req.leave_id)}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {employee?.emp_type === "Manager" && pendingApprovals.length === 0 && (
        <p className="mt-3">No pending leave requests for approval.</p>
      )}
    </div>
  );


      case "calendar":
    return <Calendar />;
      case "team":
        return (
          <>
            <Team managerId={managerId}/>
          </>
        )


      case "leave-request":
        return (
          <div className="p-4">
            <h4>Apply for Leave</h4>
            <form onSubmit={handleLeaveSubmit} className="mb-4">
              <div className="row g-3">
                <div className="col-md-3">
                  <input
                    type="date"
                    className="form-control"
                    value={leaveForm.start_date}
                    onChange={(e) =>
                      setLeaveForm({ ...leaveForm, start_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="date"
                    className="form-control"
                    value={leaveForm.end_date}
                    onChange={(e) =>
                      setLeaveForm({ ...leaveForm, end_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-control"
                    value={leaveForm.type}
                    onChange={(e) =>
                      setLeaveForm({ ...leaveForm, type: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Casual">Casual Leave</option>
                    <option value="Paid">Paid Leave</option>
                    <option value="LOP">Loss of Leave</option>
                    <option value="Floating">Floating Leave</option>
                    <option value="Maternity">Maternity Leave</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Reason"
                    value={leaveForm.reason}
                    onChange={(e) =>
                      setLeaveForm({ ...leaveForm, reason: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-3">
                Submit Leave
              </button>
            </form>

            <h4 className="mt-4">Your Leave Requests</h4>
<div className="table-responsive">
  <table className="table table-bordered table-striped">
    <thead className="table-dark">
      <tr>
        <th>#</th>
        <th>Start Date</th>
        <th>End Date</th>
        <th>Type</th>
        <th>Reason</th>
        <th>Status</th>
        <th>Requested At</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      {leaveRequests?.length > 0 ? (
        leaveRequests.map((lv, index) => (
          <tr key={lv.id}>
            <td>{index + 1}</td>
            <td>{lv.start_date}</td>
            <td>{lv.end_date}</td>
            <td>{lv.leave_type}</td> {/* change from lv.leave_type_id to lv.leave_type */}
            <td>{lv.reason}</td>
            <td>
              <span
                className={`badge ${
                  lv.status === "Approved"
                    ? "bg-success"
                    : lv.status === "Pending"
                    ? "bg-warning text-dark"
                    : "bg-danger"
                }`}
              >
                {lv.status}
              </span>
            </td>
            <td>{new Date(lv.requested_at).toLocaleString()}</td>
            <td>
              {lv.status === "Pending" && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(lv.id)}
                >
                  Delete
                </button>
              )}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="8" className="text-center">
            No leave requests found
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

          </div>
        );


      case "policies":
        return (
          <div className="p-4">
            <h4>Leave Policies</h4>
      <p>This Leave Policy outlines the types of leaves, approval process, and key guidelines for all employees.</p>

      <ul>
        <li><strong>Casual Leave (CL):</strong> 8 days per year.</li>
        <li><strong>Sick Leave (SL):</strong> 10 days per year. Medical certificate required for more than 2 days.</li>
        <li><strong>Earned Leave (EL):</strong> 15 days per year. Advance notice required.</li>
        <li><strong>Maternity Leave:</strong> 26 weeks (as per law).</li>
        <li><strong>Paternity Leave:</strong> 7 days within 6 months of childbirth.</li>
        <li><strong>Floating Leave:</strong> 2 days annually for personal/festival use.</li>
      </ul>

      <h5>Approval Workflow</h5>
      <p>
        Leave approval varies by duration:
        <br />
        - 1 to 3 days: Manager approval<br />
        - 4 to 7 days: Manager → HR<br />
        - 8+ days: Manager → HR → Director
      </p>

      <h5>Accrual & Guidelines</h5>
      <ul>
        <li>Earned Leaves can carry forward up to 30 days.</li>
        <li>Unauthorized absences lead to loss of pay.</li>
        <li>All leave must be updated in the Leave Management System.</li>
        <li>Unutilized CL/SL will lapse at year-end.</li>
      </ul>

      <button className="btn btn-outline-primary mt-3" onClick={downloadPDF}>
        Download Policy as PDF
      </button>
          </div>
        );
      default:
        return null;
    }
  };
  console.log("team data:",team);

  return (
    <div className="d-flex vh-100 flex-column flex-md-row">
      <div
        className={`bg-dark text-white p-3 ${
          sidebarOpen ? "" : "d-none d-md-block"
        }`}
        style={{ width: "250px", height: "100vh", position: "sticky", top: 0 }}
      >
        <h4 className="text-center mb-4">Dashboard</h4>
        <div className="d-grid gap-2">
          <div className="btn btn-outline-light" onClick={() => setActiveTab("home")}><FaHome />Home</div>
          <div className="btn btn-outline-light"
              onClick={() => setActiveTab("calendar")}>
              <FaCalendarAlt /> Calendar
          </div>
          <div className="btn btn-outline-light"
              onClick={() => setActiveTab("team")}>
              <FaUsers /> Team
          </div>
          <div className="btn btn-outline-light"
              onClick={() => setActiveTab("leave-request")}>
              <FaFileAlt /> Leave Request
          </div>
          <div className="btn btn-outline-light"
              onClick={() => setActiveTab("policies")}>
              <FaBook /> Policies
          </div>
          <button className="btn btn-danger w-100">
            <FaSignOutAlt /> <Link to="/" className="text-white">LOGOUT</Link>
          </button>
        </div>
      </div>

      <div className="d-flex flex-column flex-row min-vh-100 w-100 p-3 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="m-0">{activeTab.replace("-", " ").toUpperCase()}</h5>
          <button
            className="btn btn-outline-dark d-md-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FaBars />
          </button>
        </div>
        <div>{renderContent()}</div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
