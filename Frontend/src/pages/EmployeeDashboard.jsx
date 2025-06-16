import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "bootstrap/dist/css/bootstrap.min.css";
import Calendar from "../pages/Calendar";
import { useNavigate, Link } from "react-router-dom";
import {
  FaHome,
  FaCalendarAlt,
  FaUsers,
  FaFileAlt,
  FaBook,
  FaSignOutAlt,
  FaBars,
} from "react-icons/fa";
import team from "../context/teamData";
import leaveBalance from "../context/leaveBalane";
import Team from "../pages/Team";
const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [employee, setEmployee] = useState(null);
  const [events, setEvents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [leaveForm, setLeaveForm] = useState({
    start_date: "",
    end_date: "",
    type: "",
    reason: "",
  });
  const [leaveRequests, setLeaveRequest] = useState([]);

  const token = localStorage.getItem("token");
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
      case "home": {
  const getBalanceByRole = (role) => {
    switch (role?.toLowerCase()) {
      case "manager":
        return leaveBalance[0];
      case "employee":
        return leaveBalance[1];
      case "intern":
        return leaveBalance[2];
      default:
        return {};
    }
  };

  const balance = getBalanceByRole(employee?.emp_type);

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Profile Card */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h4 className="card-title mb-3 text-primary">👤 Profile Information</h4>
              <p><strong>Name:</strong> {employee?.name}</p>
              <p><strong>Email:</strong> {employee?.email}</p>
              <p><strong>Role:</strong> {employee?.emp_type}</p>
              <p><strong>Manager:</strong>{employee?.manager_id}</p>
              <p><strong>Manager Name:Manager</strong></p>

            </div>
          </div>
        </div>

        {/* Leave Balance Card */}
        <div className="col-md-6">
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
                    <tr><td>Sick</td><td>{balance.sick ?? 5}</td></tr>
                    <tr><td>Casual</td><td>{balance.casual ?? 3}</td></tr>
                    <tr><td>Paid</td><td>{balance.paid ?? 0}</td></tr>
                    <tr><td>Loss of pay</td><td>{balance.lop ?? 0}</td></tr>
                    <tr><td>Floating</td><td>{balance.floating ?? 3}</td></tr>
                    <tr><td>Maternity</td><td>{balance.maternity ?? 0}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
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
                  </tr>
                </thead>
                <tbody>
  {leaveRequests?.length > 0 ? (
    leaveRequests.map((lv, index) => (
      <tr key={lv.id}>
        <td>{index + 1}</td>
        <td>{lv.start_date}</td>
        <td>{lv.end_date}</td>
        <td>{lv.leave_type_id}</td>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
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
          <h5 className="mb-0">{activeTab.replace("-", " ").toUpperCase()}</h5>
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

export default EmployeeDashboard;
