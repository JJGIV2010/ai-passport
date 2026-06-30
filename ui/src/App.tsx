import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Upload from './pages/Upload'
import Review from './pages/Review'

export default function App() {
  return (
    <div className="min-h-screen bg-passport-bg text-passport-text">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/review" element={<Review />} />
      </Routes>
    </div>
  )
}
