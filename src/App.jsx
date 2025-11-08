import { Navigate, Route, Routes } from 'react-router-dom'
import FaceMood from './FaceMood.jsx'
import UploadSong from './UploadSong.jsx'

function App() {
  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100 lg:h-screen">
      <main className="flex w-full items-stretch justify-center px-4 py-6 sm:px-8 md:px-12 lg:h-full lg:items-center lg:overflow-hidden lg:py-10">
        <Routes>
          <Route path="/" element={<FaceMood />} />
          <Route path="/upload" element={<UploadSong />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
