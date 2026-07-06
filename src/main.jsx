import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./redux/app/store.js";
import { message } from "antd";

// Globally override window.alert to use Ant Design's message
window.alert = (msg) => {
  if (!msg) return;
  const lowerMsg = String(msg).toLowerCase();
  if (
    lowerMsg.includes("success") ||
    lowerMsg.includes("completed") ||
    lowerMsg.includes("sent") ||
    lowerMsg.includes("added")
  ) {
    message.success(msg);
  } else if (
    lowerMsg.includes("failed") ||
    lowerMsg.includes("fail") ||
    lowerMsg.includes("error") ||
    lowerMsg.includes("mandatory") ||
    lowerMsg.includes("select both") ||
    lowerMsg.includes("required")
  ) {
    message.error(msg);
  } else if (
    lowerMsg.includes("warning") ||
    lowerMsg.includes("please") ||
    lowerMsg.includes("invalid")
  ) {
    message.warning(msg);
  } else {
    message.info(msg);
  }
};

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <App />
  </Provider>
);
