const express = require('express');
const teamController = require('../controllers/teamController');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
// GET /api/v1/team/by-manager/:managerId
router.get('/manager/:managerId',teamController.getTeamByManagerId);

module.exports = router;
