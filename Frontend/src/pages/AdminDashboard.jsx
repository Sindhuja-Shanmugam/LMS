import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form } from "react-bootstrap";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import {Link} from 'react-router-dom';
import Calendar from "../pages/Calendar";
import {
  FaHome,
  FaUsers,
  FaFileAlt,
  FaBook,
  FaSignOutAlt
} from "react-icons/fa";


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [admin, setAdmin] = useState({});
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("");
  const [formData, setFormData] = useState({ name: "", description: "" });

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (activeTab === "home") {
      axios.get("http://localhost:5000/api/v1/employees/me", authHeader)
        .then(res => setAdmin(res.data));
      fetchCalendarEvents();
    } else if (activeTab === "leave-types") {
      axios.get("http://localhost:5000/api/v1/leave-types", authHeader)
        .then(res => setLeaveTypes(res.data));
    } else if (activeTab === "employee-types") {
      axios.get("http://localhost:5000/api/v1/employee-types", authHeader)
        .then(res => setEmployeeTypes(res.data));
    } else if (activeTab === "leave-requests") {
      axios.get("http://localhost:5000/api/v1/leave-requests", authHeader)
        .then(res => setLeaveRequests(res.data));
    }
  }, [activeTab]);

  const fetchCalendarEvents = async () => {
    const leaveRes = await axios.get("http://localhost:5000/api/v1/leave-requests?status=Approved&upcoming=true", authHeader);
    const holidayRes = await axios.get("http://localhost:5000/api/v1/holidays", authHeader);
    const leaveEvents = leaveRes.data.map(lr => ({
      title: `Leave: ${lr.employee_id}`,
      start: lr.start_date,
      end: lr.end_date,
      color: "#28a745"
    }));
    const holidayEvents = holidayRes.data.map(h => ({
      title: `Holiday: ${h.name}`,
      start: h.date,
      color: "#dc3545"
    }));
    setEvents([...leaveEvents, ...holidayEvents]);
  };

  const openModal = (mode, item = null) => {
    setModalMode(mode);
    if (item) {
      setEditItem(item);
      setFormData({ name: item.name, description: item.description || "" });
    } else {
      setEditItem(null);
      setFormData({ name: "", description: "" });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const urlBase = modalMode.includes("leave") ? "leave-types" : "employee-types";
    const url = `http://localhost:5000/api/v1/${urlBase}`;
    try {
      if (modalMode.startsWith("add")) {
        await axios.post(url, formData, authHeader);
      } else if (modalMode.startsWith("edit")) {
        await axios.put(`${url}/${editItem.id}`, formData, authHeader);
      }
      alert("Saved successfully");
      setShowModal(false);
      setActiveTab(urlBase);
    } catch (error) {
      alert("Error saving item");
    }
  };

  const handleDelete = async (id, type) => {
    const url = `http://localhost:5000/api/v1/${type}/${id}`;
    if (window.confirm("Are you sure you want to delete this?")) {
      await axios.delete(url, authHeader);
      alert("Deleted successfully");
      setActiveTab(type);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div>
            <h3>Welcome, {admin.name}</h3>
            <p>Email: {admin.email}</p>
            <p>Role: {admin.emp_type}</p>
            <h5 className="mt-4">Upcoming Leaves & Holidays</h5>
             case "calendar":
             <Calendar />;
          </div>
        );

      case "leave-types":
        return (
          <div>
            <div className="w-full min-h-screen p-5 bg-white">
              <h4>Leave Types</h4>
              <Button onClick={() => openModal("add-leave")}>Add Leave Type</Button>
            </div>
            {leaveTypes.map(type => (
              <div key={type.id} className="border p-2 mb-2 d-flex justify-content-between align-items-center">
                <div>
                  <strong>{type.name}</strong> - {type.description}
                </div>
                <div>
                  <Button className="btn-sm me-2" onClick={() => openModal("edit-leave", type)}>Edit</Button>
                  <Button variant="danger" className="btn-sm" onClick={() => handleDelete(type.id, "leave-types")}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        );

      case "employee-types":
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Employee Types</h4>
              <Button onClick={() => openModal("add-emp")}>Add Employee Type</Button>
            </div>
            {employeeTypes.map(type => (
              <div key={type.id} className="border p-2 mb-2 d-flex justify-content-between align-items-center">
                <span>{type.name}</span>
                <div>
                  <Button className="btn-sm me-2" onClick={() => openModal("edit-emp", type)}>Edit</Button>
                  <Button variant="danger" className="btn-sm" onClick={() => handleDelete(type.id, "employee-types")}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        );

      case "leave-requests":
        return (
          <div>
            <h4>All Leave Requests</h4>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map(req => (
                  <tr key={req.id}>
                    <td>{req.id}</td>
                    <td>{req.employee_id}</td>
                    <td>{req.leave_type_id}</td>
                    <td>{req.start_date}</td>
                    <td>{req.end_date}</td>
                    <td>{req.status}</td>
                    <td>{req.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return <p>Select a section from the sidebar</p>;
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <div className="bg-dark text-white p-3" style={{ width: "230px" }}>
        <h5 className="text-center mb-4">Admin Panel</h5>
        <div className="d-grid gap-2">
          <div className="btn btn-outline-light" onClick={() => setActiveTab("home")}><FaHome />Home</div>
          <div className="btn btn-outline-light" onClick={() => setActiveTab("employee-types")}><FaUsers /> Employee Type</div>
          <div className="btn btn-outline-light" onClick={() => setActiveTab("leave-types")}><FaBook />Leave Type</div>
          <div className="btn btn-outline-light" onClick={() => setActiveTab("leave-requests")}><FaFileAlt />View Leave Requests</div>
          <button className="btn btn-danger w-100">
                      <FaSignOutAlt /> <Link to="/" className="text-white">LOGOUT</Link>
                    </button>        
        </div>
      </div>

      <div className="flex-grow-1 p-4">
        {renderContent()}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{modalMode.startsWith("add") ? "Add" : "Edit"} {modalMode.includes("leave") ? "Leave Type" : "Employee Type"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </Form.Group>
            {modalMode.includes("leave") && (
              <Form.Group className="mt-2">
                <Form.Label>Description</Form.Label>
                <Form.Control value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard;