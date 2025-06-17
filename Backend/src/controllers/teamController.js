const db = require("../db");
const logger = require('../utils/logger');

exports.getTeamByManagerId = async (req, res) => {
  const { managerId } = req.params;

  console.log("🔍 Request received for /manager/" + managerId);
  logger.info(`📥 Request to /manager/${managerId}`);
  try {
    const query1 = `SELECT * FROM employee WHERE manager_id = ?`;
    const [rows] = await db.execute(query1, [managerId]); // ✅ use parameterized query

    logger.info(`✅ Team members found: ${rows.length}`);
    console.log("✅ Team members found:", rows.length);
    console.log("👥 Data:", rows);

    return res.status(200).json(rows); // ✅ send just the data
  } catch (error) {
    logger.error(`🔥 Error fetching team by managerId ${managerId}: ${error.message}`);
    console.error("🔥 Unexpected server error:", error);
    return res.status(500).json({
      message: "Unexpected server error",
      error: error.message,
    });
  }
};


exports.getMyTeam = async (req, res) => {
  const employeeId = req.user.id;

  try {
    const [empRows] = await db.execute('SELECT manager_id FROM employee WHERE id = ?', [employeeId]);
    if (!empRows.length) return res.status(404).json({ message: "Employee not found" });

    const managerId = empRows[0].manager_id;
    if (!managerId) return res.status(200).json({ manager: null, teammates: [] });

    const [managerRows] = await db.execute('SELECT id, name, email FROM employee WHERE id = ?', [managerId]);
    const [teammates] = await db.execute(
      'SELECT id, name, email FROM employee WHERE manager_id = ? AND id != ?',
      [managerId, employeeId]
    );

    res.status(200).json({
      manager: managerRows[0] || null,
      teammates: teammates || []
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
