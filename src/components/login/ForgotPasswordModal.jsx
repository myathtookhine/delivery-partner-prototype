import React, { useState } from "react";
import { Mail, ArrowLeft, ArrowRight, KeyRound, Lock, CheckCircle, X } from "lucide-react";
import Input from "../common/Input";
import Button from "../common/Button";

const STEPS = {
  EMAIL: "email",
  CODE: "code",
  RESET: "reset",
  SUCCESS: "success",
};

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setStep(STEPS.EMAIL);
    setEmail("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Step 1: Send reset code
  const handleSendCode = (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    // Simulate sending code
    setTimeout(() => {
      setLoading(false);
      setStep(STEPS.CODE);
    }, 1200);
  };

  // Step 2: Verify code
  const handleVerifyCode = (e) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    if (code.length < 4) {
      setError("Code must be at least 4 digits");
      return;
    }

    setLoading(true);
    // Simulate verifying code (any 4+ digit code works for mock)
    setTimeout(() => {
      setLoading(false);
      if (code === "0000") {
        setError("Invalid verification code. Please try again.");
        return;
      }
      setStep(STEPS.RESET);
    }, 800);
  };

  // Step 3: Reset password
  const handleResetPassword = (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(STEPS.SUCCESS);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {step !== STEPS.EMAIL && step !== STEPS.SUCCESS && (
              <button
                onClick={() => {
                  setError("");
                  if (step === STEPS.CODE) setStep(STEPS.EMAIL);
                  if (step === STEPS.RESET) setStep(STEPS.CODE);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900">
              {step === STEPS.EMAIL && "Forgot Password"}
              {step === STEPS.CODE && "Verify Code"}
              {step === STEPS.RESET && "Reset Password"}
              {step === STEPS.SUCCESS && "Password Reset"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Step indicator */}
          {step !== STEPS.SUCCESS && (
            <div className="flex items-center gap-2 mb-6">
              {[STEPS.EMAIL, STEPS.CODE, STEPS.RESET].map((s, i) => {
                const stepIndex = [STEPS.EMAIL, STEPS.CODE, STEPS.RESET].indexOf(step);
                const isActive = i <= stepIndex;
                return (
                  <React.Fragment key={s}>
                    <div
                      className={`h-2 flex-1 rounded-full transition-colors ${
                        isActive ? "bg-indigo-500" : "bg-gray-200"
                      }`}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2">
              <X className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Step 1: Email */}
          {step === STEPS.EMAIL && (
            <form onSubmit={handleSendCode}>
              <div className="text-center mb-5">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                  <Mail className="h-7 w-7 text-indigo-500" />
                </div>
                <p className="text-sm text-gray-500">
                  Enter your email address and we'll send you a verification
                  code to reset your password.
                </p>
              </div>

              <Input
                label="Email address"
                name="reset-email"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                containerClassName="mb-5"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Send Verification Code
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          )}

          {/* Step 2: Verification Code */}
          {step === STEPS.CODE && (
            <form onSubmit={handleVerifyCode}>
              <div className="text-center mb-5">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                  <KeyRound className="h-7 w-7 text-indigo-500" />
                </div>
                <p className="text-sm text-gray-500">
                  We've sent a 6-digit code to{" "}
                  <span className="font-semibold text-gray-700">{email}</span>.
                  Enter it below.
                </p>
              </div>

              <Input
                label="Verification Code"
                name="verify-code"
                type="text"
                icon={KeyRound}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code"
                containerClassName="mb-2"
                maxLength={6}
              />

              <p className="text-xs text-gray-400 mb-5">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setLoading(true);
                    setTimeout(() => setLoading(false), 1000);
                  }}
                  className="text-indigo-500 hover:text-indigo-600 font-medium"
                >
                  Resend
                </button>
              </p>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Verify Code
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === STEPS.RESET && (
            <form onSubmit={handleResetPassword}>
              <div className="text-center mb-5">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                  <Lock className="h-7 w-7 text-indigo-500" />
                </div>
                <p className="text-sm text-gray-500">
                  Create a new password for your account. Make sure it's at
                  least 6 characters.
                </p>
              </div>

              <Input
                label="New Password"
                name="new-password"
                type="password"
                icon={Lock}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                containerClassName="mb-4"
              />

              <Input
                label="Confirm Password"
                name="confirm-password"
                type="password"
                icon={Lock}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                containerClassName="mb-5"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Reset Password
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === STEPS.SUCCESS && (
            <div className="text-center py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Password Reset Successful!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Your password has been updated. You can now sign in with your
                new password.
              </p>
              <Button
                variant="primary"
                size="lg"
                block
                onClick={handleClose}
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
