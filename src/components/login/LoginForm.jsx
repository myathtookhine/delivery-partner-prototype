import React, { useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Button from "../common/Button";
import Input from "../common/Input";
import ForgotPasswordModal from "./ForgotPasswordModal";

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  handleSubmit,
}) => {
  const [showForgot, setShowForgot] = useState(false);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Input
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          icon={Mail}
          containerClassName="mb-5"
        />

        <div className="mb-6">
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            icon={Lock}
            containerClassName="mb-6"
            labelAddon={
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs text-hoverColor hover:text-from-indigo font-medium"
              >
                Forgot password?
              </button>
            }
          />
        </div>

        <Button type="submit" variant="primary" size="lg" block>
          <span>Sign in</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <ForgotPasswordModal
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
      />
    </>
  );
};

export default LoginForm;
