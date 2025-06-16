const db = require('../db');

exports.createLeaveType = async (req, res) => {
  const { name, description } = req.body;
  try {
    const [r] = await db.execute(
      `INSERT INTO LeaveType (name, description) VALUES (?, ?)`,
      [name, description]
    );
    res.status(201).json({ message: 'Leave type created', id: r.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLeaveTypes = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM LeaveType`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLeaveType = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    await db.execute(
      `UPDATE LeaveType SET name = ?, description = ? WHERE id = ?`,
      [name, description, id]
    );
    res.json({ message: 'Leave type updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteLeaveType = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute(`DELETE FROM LeaveType WHERE id = ?`, [id]);
    res.json({ message: 'Leave type deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
