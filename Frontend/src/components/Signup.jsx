import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate,Link } from 'react-router-dom';
import "./Signup.css";

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', emp_type_id: '',manager_id:'' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:5000/api/v1/auth/register', form);
    navigate('/');
  };

  return (
    <div className="signup-container ">
    <form onSubmit={handleSubmit} className="signup-form">
      <h2>Signup</h2>
      <input name="name" onChange={handleChange} placeholder="Name" className="form-control mb-2" required />
      <input name="email" onChange={handleChange} placeholder="Email" className="form-control mb-2" required />
      <input name="password" type="password" onChange={handleChange} placeholder="Password" className="form-control mb-2" required />
      <select name="emp_type_id" onChange={handleChange} className="form-select mb-2" required>
        <option value="">Select Role</option>
        <option value="1">Admin</option>
        <option value="2">Manager</option>
        <option value="3">HR</option>
        <option value="4">Director</option>
        <option value="5">Employee</option>
        <option value="6">Intern</option>
      </select>
      <input name="manager_id" onChange={handleChange} placeholder="Manager ID or Null" className="form-control mb-2"/>
      <button type="submit" className="btn btn-primary">Sign Up</button>
    <p className="login-link">
          Do you have an account? <Link to="/">Login</Link>
        </p>
    </form>
    </div>
  );
};

export default Signup;

