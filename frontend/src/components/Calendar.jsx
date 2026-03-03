import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const Calendar = () => {
  const handleDateClick = (info) => {
    const title = prompt("Enter event title:");
    if (title) {
      info.view.calendar.addEvent({
        title,
        start: info.dateStr,
      });
    }
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      events={[
        { title: "Meeting", date: "2026-03-05" },
        {
          title: "Workout",
          start: "2026-03-06T10:00:00",
          end: "2026-03-06T12:00:00",
        },
      ]}
      dateClick={handleDateClick}
    />
  );
};

export default Calendar;
/*
const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  // Add event for a specific day
  const handleAddEvent = (day) => {
    const eventText = prompt(`Enter event for ${day}`);
    if (eventText) {
      const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
      setEvents((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), eventText],
      }));
    }
  };

  // Generate calendar cells
  const renderCalendar = () => {
    const startDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    ).getDay(); // 0=Sun
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    ).getDate();

    const rows = [];
    let dayCount = 1;

    for (let week = 0; week < 6; week++) {
      const cells = [];
      for (let day = 0; day < 7; day++) {
        if ((week === 0 && day < startDay) || dayCount > daysInMonth) {
          // Empty cell
          cells.push(
            <td
              key={`empty-${week}-${day}`}
              style={{
                border: "1px solid #ccc",
                height: "80px",
                verticalAlign: "top",
              }}
            ></td>,
          );
        } else {
          const currentDay = dayCount;
          const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${dayCount}`;
          cells.push(
            <td
              key={key}
              onClick={() => handleAddEvent(currentDay)}
              style={{
                border: "1px solid #ccc",
                height: "80px",
                verticalAlign: "top",
                padding: "4px",
                cursor: "pointer",
              }}
            >
              <div>{currentDay}</div>
              {events[key] &&
                events[key].map((ev, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#f0ad4e",
                      color: "white",
                      borderRadius: "4px",
                      fontSize: "12px",
                      marginTop: "2px",
                      padding: "2px",
                    }}
                  >
                    {ev}
                  </div>
                ))}
            </td>,
          );
          dayCount++;
        }
      }
      rows.push(<tr key={week}>{cells}</tr>);
    }

    return rows;
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto" }}>
      <h2>
        {currentDate.toLocaleString("default", { month: "long" })}{" "}
        {currentDate.getFullYear()}
      </h2>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={handlePrevMonth} style={{ marginRight: "5px" }}>
          Prev
        </button>
        <button onClick={handleNextMonth}>Next</button>
      </div>
      <table
        style={{
          borderCollapse: "collapse",
          tableLayout: "fixed",
          width: "100%",
        }}
      >
        <thead>
          <tr>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <th
                key={d}
                style={{
                  border: "1px solid #ccc",
                  height: "40px",
                  backgroundColor: "#eee",
                }}
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{renderCalendar()}</tbody>
      </table>
    </div>
  );
};

export default Calendar;
*/
