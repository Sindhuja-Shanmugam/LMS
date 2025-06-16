require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
require('./db');
app.use(express.json());

const cors = require('cors');
app.use(cors());

app.use(cors({
  origin: 'http://localhost:5173', // Vite default
}));



const authRoutes         = require('./routes/authRoutes');
const employeeTypeRoutes = require('./routes/employeeTypeRoutes');
const employeeRoutes     = require('./routes/employeeRoutes');
const leaveTypeRoutes    = require('./routes/leaveTypeRoutes');
const leavePolicyRoutes  = require('./routes/leavePolicyRoutes');
const leaveRequestRoutes = require('./routes/leaveRequestRoutes');
const leaveBalanceRoutes = require('./routes/leaveBalanceRoutes');
const approvalRoutes     = require('./routes/approvalFlowRoutes');
const calendarRoutes     = require('./routes/calendarRoutes');
const teamRoutes         = require('./routes/teamRoutes');
const approvalRoutes1     =require('./routes/approvalRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
app.use(bodyParser.json());


// Versioned API: /api/v1/...
app.use('/api/v1/auth',            authRoutes);
app.use('/api/v1/employee-types',   employeeTypeRoutes);
app.use('/api/v1/employees',        employeeRoutes);
app.use('/api/v1/leave-types',      leaveTypeRoutes);
app.use('/api/v1/leave-policies',   leavePolicyRoutes);
app.use('/api/v1/leave-requests',   leaveRequestRoutes);
app.use('/api/v1/leave-balances',   leaveBalanceRoutes);
app.use('/api/v1/approvals',        approvalRoutes);
app.use('/api/calendar',         calendarRoutes);
app.use('/api/v1/team',             teamRoutes);
app.use('/api/v1/approvalstate1',approvalRoutes1);
app.use('/api', leaveRoutes);
app.get('/', (req, res) => res.send('LMS Backend Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
