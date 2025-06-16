const db = require('../db');

exports.createEmployeeType = async (req, res) => {
  const { name, description } = req.body;
  try {
    const [r] = await db.execute(
      `INSERT INTO EmployeeType (name, description) VALUES (?, ?)`,
      [name, description]
    );
    res.status(201).json({ message: 'Employee type created', id: r.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEmployeeTypes = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM EmployeeType`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateEmployeeType = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    await db.execute(
      `UPDATE EmployeeType SET name = ?, description = ? WHERE id = ?`,
      [name, description, id]
    );
    res.json({ message: 'Employee type updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEmployeeType = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute(`DELETE FROM EmployeeType WHERE id = ?`, [id]);
    res.json({ message: 'Employee type deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
