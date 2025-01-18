import React from "react";
import { Outlet } from "react-router-dom";
import "../utilities.css";

const App = () => {
  return (
    <div className="app-container">
      <Outlet />
    </div>
  );
};

export default App;
