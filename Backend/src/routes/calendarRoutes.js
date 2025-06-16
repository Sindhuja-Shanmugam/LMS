const express = require('express');
const router = express.Router();
const { authenticate }   = require('../middleware/authMiddleware');

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const roleId = req.user.employee_type_id;

    // Holidays
    const holidays = await prisma.holiday.findMany();
    const holidayEvents = holidays.map(h => ({
      title: 'Holiday',
      start: h.date,
      end: h.date,
      display: 'background',
      backgroundColor: '#22c55e',
      extendedProps: { type: 'holiday', description: h.description }
    }));

    // Floating leaves
    const floatingLeaves = await prisma.floatingLeave.findMany();
    const floatingEvents = floatingLeaves.map(f => ({
      title: 'Floating Leave',
      start: f.leave_date,
      end: f.leave_date,
      display: 'background',
      backgroundColor: '#facc15',
      extendedProps: { type: 'floating', description: f.description }
    }));

    // Approved Leaves
    let leaves;
    if ([2, 3, 4].includes(roleId)) { // Manager, HR, Director
      leaves = await prisma.leaveRequest.findMany({
        where: { status: 'approved' },
        include: { employee: true }
      });
    } else {
      leaves = await prisma.leaveRequest.findMany({
        where: { status: 'approved', employee_id: userId },
        include: { employee: true }
      });
    }

    const leaveEvents = leaves.map(l => ({
      title: l.employee.name,
      start: l.start_date,
      end: l.end_date,
      backgroundColor:
        l.leave_type_id === 1 ? '#ef4444' : // Sick
        l.leave_type_id === 2 ? '#38bdf8' : // Casual
        '#eab308', // LOP or others
      extendedProps: {
        employee: l.employee.name,
        type: l.leave_type_id === 1 ? 'sick' : l.leave_type_id === 2 ? 'casual' : 'lop',
        reason: l.reason,
        status: l.status,
      }
    }));

    // Combine all
    const allEvents = [...holidayEvents, ...floatingEvents, ...leaveEvents];

    res.json({ events: allEvents });

  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).json({ message: 'Server error fetching calendar data' });
  }
});

module.exports = router;
