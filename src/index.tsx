import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";

const App: React.FC = () => (
    <div className="flex justify-center items-center h-screen bg-gray-100">
        <h1 className="text-3xl font-bold text-gray-900">
            Bridge of Hearts Sri Lanka
        </h1>
    </div>
);

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
