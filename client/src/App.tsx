import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import FileUpload from "./components/FileUpload";
import FileList from "./components/FileList";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 p-8">
        <nav className="mb-8">
          <ul className="flex space-x-4">
            <li>
              <Link to="/" className="text-blue-600 hover:text-blue-800">
                Upload
              </Link>
            </li>
            <li>
              <Link to="/files" className="text-blue-600 hover:text-blue-800">
                Files
              </Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<FileUpload />} />
          <Route path="/files" element={<FileList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
