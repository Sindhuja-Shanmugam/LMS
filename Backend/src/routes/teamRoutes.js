const express = require('express');
const router = express.Router();
const { getMyTeam } = require('../controllers/teamController');
const { getTeamByManagerId}=require('../controllers/teamController');
const {authenticate} = require('../middleware/authMiddleware');

// Route for team by manager ID
router.get('/manager/:managerId', getTeamByManagerId);

// Route for current user's team (for Employee)
router.get('/my-team', authenticate, getMyTeam);

module.exports = router;
