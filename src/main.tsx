import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthProvider";
import { DataCacheProvider } from "@/context/DataCacheProvider";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";
import App from "@/App";
import "@/styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DataCacheProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </DataCacheProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
