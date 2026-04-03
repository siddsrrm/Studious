import React, { createContext, useContext, useEffect, useState } from "react";
import { useEvents } from "../hooks/useEvents";

export const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
  const { events, createEvent, editEvent, deleteEvent } = useEvents();

  return (
    <CalendarContext.Provider
      value={{
        events,
        onCreateEvent: createEvent,
        onEditEvent: editEvent,
        onDeleteEvent: deleteEvent,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
