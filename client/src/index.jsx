import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import FilterPage from "./components/pages/FilterPage";
import ResultsPage from "./components/pages/ResultsPage";
import NotFound from "./components/pages/NotFound";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<NotFound />} element={<App />}>
      <Route path="/" element={<FilterPage />} />
      <Route path="/results" element={<ResultsPage />} />
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
