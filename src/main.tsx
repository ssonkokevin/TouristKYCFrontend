import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { AuthProvider } from "@/hooks/useAuth";
import "@/index.css";

// Google Sign-In (GoogleOAuthProvider) removed — disabled deployment-wide,
// see Login.tsx and backend authService.ts for details.

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
