import { RouterProvider } from "react-router-dom";

// styles
import "./App.css";
import router from "./routes";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ConnectWallet } from "@nfid/identitykit/react";

function App() {
  
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <RouterProvider router={router} />
      <ConnectWallet />
    </>
  );
}

export default App;
