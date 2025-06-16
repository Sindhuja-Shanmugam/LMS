const db = require('../db');

// 1. Create a holiday (Admin only)
exports.createHoliday = async (req, res) => {
  const { title, date, is_national, is_floater } = req.body;
  try {
    const [r] = await db.execute(
      `INSERT INTO CalendarHolidays (title, date, is_national, is_floater)
       VALUES (?, ?, ?, ?)`,
      [title, date, is_national, is_floater]
    );
    res.status(201).json({ message: 'Holiday created', id: r.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get all holidays (anyone authenticated)
exports.getHolidays = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM CalendarHolidays ORDER BY date`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Delete a holiday (Admin only)
exports.deleteHoliday = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute(`DELETE FROM CalendarHolidays WHERE id = ?`, [id]);
    res.json({ message: 'Holiday deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};


const getFloatingLeaves = async (req, res) => {
  try {
    const floatingLeaves = await prisma.floatingLeaves.findMany();
    res.json(floatingLeaves);
  } catch (error) {
    console.error("Error fetching floating leaves", error);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = { getFloatingLeaves };