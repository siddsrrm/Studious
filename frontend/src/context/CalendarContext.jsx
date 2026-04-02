import React, { createContext, useContext, useEffect, useState } from "react";
import { useEvents } from "../hooks/useEvents";

const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
  const { events, createEvent, editEvent, deleteEvent } = useEvents();
  const [loading, setLoading] = useState(false);

  return (
    <CalendarContext.Provider
      value={{
        events,
        loading,
        onCreateEvent: createEvent,
        onEditEvent: editEvent,
        onDeleteEvent: deleteEvent,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

// Hook to access calendar context
export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context)
    throw new Error("useCalendar must be used within a CalendarProvider");
  return context;
};
