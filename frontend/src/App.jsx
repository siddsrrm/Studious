import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import ProfileSettings from "./pages/Customize";
import DeleteAccount from "./pages/Deletion";
import FilterNotes from "./pages/Filtering";
import HomePage from "./pages/HomePage/HomePage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route path="/settings/:username" element={<ProfileSettings />} />
        <Route path="/delete/:username" element={<DeleteAccount />} />
        <Route path="/notes" element={<FilterNotes />} />
        {/* Your main page route can go here later */}
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
