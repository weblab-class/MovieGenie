import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import FilterPage from "./pages/FilterPage";
import ResultsPage from "./pages/ResultsPage";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import WatchListPage from "./pages/WatchListPage";
import { GoogleOAuthProvider } from "@react-oauth/google";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

const GOOGLE_CLIENT_ID = "920670602163-kot52u1ps9vbpdr67l7q9u5m59gjjqeu.apps.googleusercontent.com";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<NotFound />} element={<App />}>
      <Route index element={<LandingPage />} />
      <Route path="filter" element={<FilterPage />} />
      <Route path="results" element={<ResultsPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="watchlist" element={<WatchListPage />} />
    </Route>
  )
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
