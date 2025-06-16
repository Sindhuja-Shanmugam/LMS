const db = require("../db");

exports.getTeamByManagerId = async (req, res) => {
  const { managerId } = req.params;

  console.log("🔍 Request received for /manager/" + managerId);

  try {
    const query1 = `SELECT * FROM employee WHERE manager_id = ?`;
    const [rows] = await db.execute(query1, [managerId]); // ✅ use parameterized query

    console.log("✅ Team members found:", rows.length);
    console.log("👥 Data:", rows);

    return res.status(200).json(rows); // ✅ send just the data
  } catch (error) {
    console.error("🔥 Unexpected server error:", error);
    return res.status(500).json({
      message: "Unexpected server error",
      error: error.message,
    });
  }
};
