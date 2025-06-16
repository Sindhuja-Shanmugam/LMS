import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const Calendar = () => {
  const [events, setEvents] = useState([]);
useEffect(() => {
  // 1. Approved leave events
  const leaveEvents = [
    {
      title: "Employee 11 - Medical Leave",
      start: "2025-06-04",
      end: "2025-06-09",
      backgroundColor: "#ef4444", // red
      borderColor: "#fff",
    },
    {
      title: "Employee 11 - Medical Leave",
      start: "2025-06-10",
      end: "2025-06-16",
      backgroundColor: "#ef4444",
      borderColor: "#fff",
    },
    {
      title: "Employee 32 - Fever",
      start: "2025-06-12",
      end: "2025-06-14",
      backgroundColor: "#f97316", // orange
      borderColor: "#fff",
    },
    {
      title: "Employee 10 - Family Function",
      start: "2025-06-16",
      end: "2025-06-21",
      backgroundColor: "#38bdf8", // blue
      borderColor: "#fff",
    },
  ];

  // 2. Weekly Offs (Saturdays and Sundays)
const generateWeeklyOffs = (startYear, endYear) => {
  const offs = [];
  const startDate = new Date(`${startYear}-01-01`);
  const endDate = new Date(`${endYear}-12-31`);

  while (startDate <= endDate) {
    const day = startDate.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      offs.push({
        start: startDate.toISOString().split("T")[0],
        end: startDate.toISOString().split("T")[0],
        display: "background",
        backgroundColor: "#d3d3d3",
        allDay: true,
      });
    }
    startDate.setDate(startDate.getDate() + 1);
  }

  return offs;
};


  // 3. Floating Leaves (hardcoded dates)
  const floatingLeaves = [
  {
    title: 'Pongal - Floating Leave',
    start: '2025-01-15',
    backgroundColor: '#9C27B0', // Purple
    borderColor: '#fff',
  },
  {
    title: 'Diwali - Floating Leave',
    start: '2025-10-21',
    backgroundColor: '#9C27B0',
    borderColor: '#fff',
  },
  {
    title: 'Christmas - Floating Leave',
    start: '2025-12-25',
    backgroundColor: '#9C27B0',
    borderColor: '#fff',
  },
  {
    title: 'Bakrid - Floating Leave',
    start: '2025-06-08',
    backgroundColor: '#9C27B0',
    borderColor: '#fff',
  },
  {
    title: 'Optional Leave',
    start: '2025-06-10',
    backgroundColor: '#9C27B0',
    borderColor: '#fff',
  },
  {
    title: 'Floating Holiday',
    start: '2025-06-13',
    backgroundColor: '#9C27B0',
    borderColor: '#fff',
  },
];



const generalHolidays = [
  {
    title: "New Year's Day",
    start: '2025-01-01',
    backgroundColor: '#008080', // Teal
    borderColor: '#fff',
  },
  {
    title: 'Republic Day',
    start: '2025-01-26',
    backgroundColor: '#008080',
    borderColor: '#fff',
  },
  {
    title: 'Holi',
    start: '2025-03-17',
    backgroundColor: '#008080',
    borderColor: '#fff',
  },
  {
    title: 'Good Friday',
    start: '2025-04-18',
    backgroundColor: '#008080',
    borderColor: '#fff',
  },
  {
    title: 'Labour Day',
    start: '2025-05-01',
    backgroundColor: '#008080',
    borderColor: '#fff',
  },
  {
    title: 'Independence Day',
    start: '2025-08-15',
    backgroundColor: '#008080',
    borderColor: '#fff',
  },
  {
    title: 'Gandhi Jayanti',
    start: '2025-10-02',
    backgroundColor: '#008080',
    borderColor: '#fff',
  },
  {
    title: 'Diwali',
    start: '2025-10-21',
    backgroundColor: '#008080',
    borderColor: '#fff',
  },
  {
    title: 'Christmas',
    start: '2025-12-25',
    backgroundColor: '#008080',
    borderColor: '#fff',
  },
];

  // Combine all events into calendar

  const weeklyOffs = generateWeeklyOffs(2025, 2027); // June = 5
  
   setEvents([...leaveEvents, ...floatingLeaves, ...weeklyOffs, ...generalHolidays ]);
}, []);


  return (
    <div className="p-3">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
      />

   
    </div>
  );
};

export default Calendar;
