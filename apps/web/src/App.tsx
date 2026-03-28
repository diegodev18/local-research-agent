import { BrowserRouter, Routes, Route } from "react-router-dom"

import { ResearchChat } from "@/components/chat/ResearchChat"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ResearchChat />} />
      </Routes>
    </BrowserRouter>
  )
}
