import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import "./theme.css";
import "./global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="bottom-right" richColors closeButton />
    </BrowserRouter>
  </React.StrictMode>,
);
