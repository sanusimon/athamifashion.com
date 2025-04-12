"use client";
import React, { useEffect, useState } from "react";
import "./login.scss";
import { LoginState } from "@wix/sdk";
import { useWixClient } from "@/hooks/useWixClient";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const MODE = {
  LOGIN: "LOGIN",
  REGISTER: "REGISTER",
  RESET_PASSWORD: "RESET_PASSWORD",
  RESET_PASSWORD_TOKEN: "RESET_PASSWORD_TOKEN",
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
};

const LoginPage = () => {
  const wixClient = useWixClient();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lastResetRequest, setLastResetRequest] = useState(null);


  useEffect(() => {
    const checkLoggedIn = async () => {
      const logged = await wixClient.auth.loggedIn();
      setIsLoggedIn(logged);
      if (logged) router.push("/");
    };
    checkLoggedIn();
  }, [wixClient, router]);

  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [mode, setMode] = useState(MODE.LOGIN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Detect reset password token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("forgotPasswordToken");
    if (token) {
      setResetToken(token);
      setMode(MODE.RESET_PASSWORD_TOKEN);
    }
  }, []);

  const formTitle = {
    [MODE.LOGIN]: "Log in",
    [MODE.REGISTER]: "Register",
    [MODE.RESET_PASSWORD]: "Reset your password",
    [MODE.RESET_PASSWORD_TOKEN]: "Set New Password",
    [MODE.EMAIL_VERIFICATION]: "Verify your Email",
  }[mode];

  const buttonTitle = {
    [MODE.LOGIN]: "Login",
    [MODE.REGISTER]: "Register",
    [MODE.RESET_PASSWORD]: "Send Reset Email",
    [MODE.RESET_PASSWORD_TOKEN]: "Reset Password",
    [MODE.EMAIL_VERIFICATION]: "Verify",
  }[mode];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
  
    try {
      let response;
  
      switch (mode) {
        case MODE.LOGIN:
          if (!email || !password) {
            setError("Email and password are required.");
            setIsLoading(false);
            return;
          }
  
          response = await wixClient.auth.login({ email, password });
          break;
  
        case MODE.REGISTER:
          response = await wixClient.auth.register({
            email,
            password,
            profile: { nickname: username },
          });
  
          switch (response?.loginState) {
            case LoginState.EMAIL_VERIFICATION_REQUIRED:
              setMode(MODE.EMAIL_VERIFICATION);
              setMessage(`Registration successful! A verification code was sent to ${email}.`);
              break;
  
            case LoginState.SUCCESS:
              setMessage("Registration successful! Redirecting...");
              const tokens = await wixClient.auth.getMemberTokensForDirectLogin(response.data.sessionToken);
              Cookies.set("refreshToken", JSON.stringify(tokens.refreshToken), { expires: 2 });
              wixClient.auth.setTokens(tokens);
              router.push("/");
              break;
  
            case LoginState.OWNER_APPROVAL_REQUIRED:
              setMessage("Your account is pending approval.");
              break;
  
            default:
              setError("Unexpected response from registration.");
              break;
          }
          return;
  
          case MODE.RESET_PASSWORD:
            if (lastResetRequest && Date.now() - lastResetRequest < 60000) {
              setError("Please wait at least 1 minute before requesting again.");
              return;
            }
        
            const redirectUrl =
              process.env.NODE_ENV === "development"
                ? "http://localhost:3000/login"
                : "https://aureliahfashion.com/login";
        
            await wixClient.auth.sendPasswordResetEmail(email, redirectUrl);
            setLastResetRequest(Date.now());
            setMessage("Password reset email sent. Please check your inbox.");
            return;
        
  
        case MODE.EMAIL_VERIFICATION:
          await wixClient.auth.processVerification({ verificationCode: emailCode });
          setMessage("Email verified successfully! You can now log in.");
          setMode(MODE.LOGIN);
          return;
  
        default:
          throw new Error("Invalid mode");
      }
  
      // Handle loginState for LOGIN
      if (mode === MODE.LOGIN && response) {
        switch (response?.loginState) {
          case LoginState.SUCCESS:
            setMessage("Login successful! Redirecting...");
            const tokens = await wixClient.auth.getMemberTokensForDirectLogin(response.data.sessionToken);
            Cookies.set("refreshToken", JSON.stringify(tokens.refreshToken), { expires: 2 });
            wixClient.auth.setTokens(tokens);
            router.push("/");
            break;
  
          case LoginState.FAILURE:
            if (response.errorCode === "invalidEmail") {
              setError("No account found for this email. Please check or register.");
            } else if (response.errorCode === "invalidPassword") {
              setError("Invalid password. Please try again.");
            } else if (response.errorCode === "emailAlreadyExist") {
              setError("Email already exists.");
            } else if (response.errorCode === "resetPassword") {
              setError("You need to reset your password!");
            } else {
              setError("Something went wrong during login.");
            }
            break;
  
          case LoginState.EMAIL_VERIFICATION_REQUIRED:
            setMode(MODE.EMAIL_VERIFICATION);
            setMessage(`Please verify your email to continue. A code was sent to ${email}.`);
            break;
  
          case LoginState.OWNER_APPROVAL_REQUIRED:
            setMessage("Your account is pending admin approval.");
            break;
  
          default:
            setError("Unexpected login response.");
            break;
        }
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <section className="login_page">
      <div className="container">
        <form className="login_box" onSubmit={handleSubmit}>
          <h2 className="title">{formTitle}</h2>
          <div className="form_">
            {mode === MODE.REGISTER && (
              <div className="form_control">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="John"
                  name="username"
                  value={username}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
            )}

            {mode !== MODE.EMAIL_VERIFICATION && mode !== MODE.RESET_PASSWORD_TOKEN && (
              <div className="form_control">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="john@gmail.com"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            {mode === MODE.EMAIL_VERIFICATION && (
              <>
                <div className="form_control">
                  <label>We sent a code to:</label>
                  <div className="verified-email">{email}</div>
                </div>
                <div className="form_control">
                  <label>Verification Code</label>
                  <input
                    type="text"
                    placeholder="Enter the code"
                    name="emailcode"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                  />
                </div>
              </>
            )}

            {(mode === MODE.LOGIN || mode === MODE.REGISTER) && (
              <div className="form_control">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {mode === MODE.RESET_PASSWORD_TOKEN && (
              <>
                <div className="form_control">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="form_control">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            {mode === MODE.LOGIN && (
              <span className="frgt_txt" onClick={() => setMode(MODE.RESET_PASSWORD)}>
                Forgot Password?
              </span>
            )}

            <button className="cmnBtn" disabled={isLoading}>
              {isLoading ? "Loading..." : buttonTitle}
            </button>

            {error && <div className="error">{error}</div>}
            {message && <div className="text-green-600 text-sm">{message}</div>}

            {mode === MODE.LOGIN && (
              <span className="frgt_txt" onClick={() => setMode(MODE.REGISTER)}>
                Don't have an account?
              </span>
            )}

            {mode === MODE.REGISTER && (
              <div className="text-sm underline cursor-pointer" onClick={() => setMode(MODE.LOGIN)}>
                Have an account?
              </div>
            )}

            {mode === MODE.RESET_PASSWORD && (
              <div className="text-sm underline cursor-pointer" onClick={() => setMode(MODE.LOGIN)}>
                Go back to Login
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
};

export default LoginPage;
