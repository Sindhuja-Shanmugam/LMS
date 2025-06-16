const db = require('../db');

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.id, u.name, u.email, r.name AS role,
        d.name AS department, u.manager_id
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const [[user]] = await db.execute(
      `SELECT id, name, email, role_id, department_id,
              manager_id, join_date, is_active
       FROM users
       WHERE id = ?`,
      [req.params.id]
    );
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  const { name, email, department_id, manager_id, is_active } = req.body;
  try {
    await db.execute(
      `UPDATE users
       SET name = ?, email = ?, department_id = ?, manager_id = ?, is_active = ?
       WHERE id = ?`,
      [name, email, department_id, manager_id, is_active, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await db.execute(`DELETE FROM users WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
