import React, { useState } from "react";
import LoginHeader from "../components/login/LoginHeader";
import ErrorMessage from "../components/login/ErrorMessage";
import LoginForm from "../components/login/LoginForm";
import DemoCredentials from "../components/login/DemoCredentials";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (email === "driver@example.com" && password === "password") {
      onLogin();
    } else {
      setError("Invalid credentials. Try the demo credentials below.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-primaryto-blue-50 px-4 py-24">
      <div className="w-full max-w-md">
        <LoginHeader />
        <div className="bg-white p-8 rounded-xl shadow-xl border border-border">
          <ErrorMessage message={error} />
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            handleSubmit={handleSubmit}
          />
          <DemoCredentials />
        </div>
      </div>
    </div>
  );
};

export default Login;
