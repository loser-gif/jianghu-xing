import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ArtworkGate } from "./components/ArtworkGate";
import "./theme.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ArtworkGate>
      <App />
    </ArtworkGate>
  </React.StrictMode>,
);
