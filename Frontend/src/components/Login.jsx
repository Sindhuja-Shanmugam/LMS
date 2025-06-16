import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // Make sure this file exists and is styled properly

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleChange=(e)=>{
    SetForm({...form,[e.target.name]:e.target.value});
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post("http://localhost:5000/api/v1/auth/login", {
        email,
        password,
      });
      const token=res.data.token;
      localStorage.setItem('token',token);

      const profileRes=await axios.get('http://localhost:5000/api/v1/employees/me',{
        headers:{Authorization:`Bearer ${token}`},
      });

      const empType=profileRes.data.emp_type;
      console.log('Logged in user type:',empType);
      console.log('Full profile response:', profileRes.data);

      switch(empType){
        case 'Admin':
          navigate('admin-dashboard');
          break;
        case 'Manager':
          navigate('/manager-dashboard');
          break;
        case 'HR':
          navigate('/hr-dashboard');
          break;
        case 'Director':
          navigate('/director-dashboard');
          break;
        case 'Employee':
          navigate('/employee-dashboard');
          break;
        case 'Intern':
          navigate('/intern-dashboard');
          break;
        default:
          setError('Unknown user type.');
      }

      //navigate("/dashboard/home");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <p className="signup-link">
          Don’t have an account? <Link to="/signup">Signup</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
