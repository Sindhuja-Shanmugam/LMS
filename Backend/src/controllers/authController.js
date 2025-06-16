const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password, emp_type_id, manager_id } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.execute(
      `INSERT INTO Employee
         (name, email, password_hash, emp_type_id, manager_id, created_at, is_active)
       VALUES (?, ?, ?, ?, ?, NOW(), TRUE)`,
      [name, email, hash, emp_type_id, manager_id]
    );
    res.status(201).json({ message: 'Registered', employeeId: r.insertId });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [[emp]] = await db.execute(
      `SELECT e.id, e.password_hash, et.name AS emp_type
       FROM Employee e
       JOIN EmployeeType et ON e.emp_type_id = et.id
       WHERE e.email = ? AND e.is_active = TRUE`,
      [email]
    );
    if (!emp) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, emp.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: emp.id, emp_type: emp.emp_type },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
