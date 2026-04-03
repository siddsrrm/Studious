import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getSocket } from "./socket";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import SettingsPage from "./pages/Settings/Settings";
import HomePage from "./pages/HomePage/HomePage";
import NotesPage from "./pages/NotePage";
import Verify2FA from "./pages/Verify2FA/Verify2FA";
import PeoplePage from "./pages/PeoplePage/PeoplePage";
import FriendsPage from "./pages/FriendsPage/FriendsPage";

function App() {
  const [notif, setNotif] = useState(null)
  const [notifOpacity, setNotifOpacity] = useState(false)
  const timers = useRef([])

  function showNotification(message) {
    timers.current.forEach(clearTimeout)
    setNotif(message)
    setNotifOpacity(true)
    timers.current = [
      setTimeout(() => setNotifOpacity(false), 2500),
      setTimeout(() => setNotif(null), 3500)
    ]
  }

  useEffect(() => {
    if (!localStorage.getItem("token")) return
    const socket = getSocket()

    const onRequestReceived = (request) =>
      showNotification(`${request.sender.username} sent you a friend request`)

    const onRequestAccepted = (request) =>
      showNotification(`You and ${request.recipient.username} are now friends`)

    const onFriendToast = (e) => showNotification(e.detail.message)

    socket.on("friend_request_received", onRequestReceived)
    socket.on("friend_request_accepted", onRequestAccepted)
    window.addEventListener("friend-toast", onFriendToast)

    return () => {
      socket.off("friend_request_received", onRequestReceived)
      socket.off("friend_request_accepted", onRequestAccepted)
      window.removeEventListener("friend-toast", onFriendToast)
    }
  }, [])

  return (
    <BrowserRouter>
      {notif && (
        <div className={`fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-3 max-w-xs border border-gray-200 transition-opacity duration-1000 z-50 w-fit ${notifOpacity ? "opacity-100" : "opacity-0"}`}>
          <p className="text-sm font-semibold text-gray-700">{notif}</p>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-2fa" element={<Verify2FA />} />

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/friends" element={<FriendsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
