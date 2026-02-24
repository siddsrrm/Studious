import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Customize from './pages/Customize'
import Filtering from './pages/Filtering'
import Deletion from './pages/Deletion'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/customize" element={<Customize />} />
        <Route path="/filter" element={<Filtering />} />
        <Route path="/delete" element={<Deletion />} />
      </Routes>
    </Router>
  )
}

export default App
