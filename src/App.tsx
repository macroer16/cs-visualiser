import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Bases from "./pages/Bases";
import Gates from "./pages/Gates";
import TruthTable from "./pages/TruthTable";
import Sets from "./pages/Sets";
import Cpu from "./pages/Cpu";
import Quiz from "./pages/Quiz";
import About from "./pages/About";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="bases" element={<Bases />} />
          <Route path="gates" element={<Gates />} />
          <Route path="truth-table" element={<TruthTable />} />
          <Route path="sets" element={<Sets />} />
          <Route path="cpu" element={<Cpu />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
