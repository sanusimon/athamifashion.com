"use client";
import React, { useEffect, useState } from "react";
import "./login.scss";
import { LoginState } from "@wix/sdk";
import { useWixClient } from "@/hooks/useWixClient";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Head from 'next/head';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


useEffect(() => {
  const checkLoggedIn = async () => {
    try {
      const logged = await wixClient.auth.loggedIn();
      setIsLoggedIn(logged);
      if (logged) router.push("/");
    } catch (err) {
      console.error("Error checking login:", err);
    }
  };
  checkLoggedIn();
}, [wixClient, router]);
if (isLoggedIn) return null; // Don't show login page again

if (typeof window !== "undefined" && isLoggedIn === true) {
  return null;
}


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

  const isStrongPassword = (password) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    return strongPasswordRegex.test(password);
  };

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
          if (!email || !password || !username) {
            setError("All fields are required.");
            setIsLoading(false);
            return;
          }
        
          if (!isStrongPassword(password)) {
            setError("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.");
            setIsLoading(false);
            return;
          }

          response = await wixClient.auth.register({
            email,
            password,
            profile: { nickname: username },
          });
          if (response?.loginState === undefined) {
            setError("This email may already be registered. Try logging in or resetting your password.");
            setIsLoading(false);
            return;
          }

          switch (response?.loginState) {
            case LoginState.EMAIL_VERIFICATION_REQUIRED:
              setMode(MODE.EMAIL_VERIFICATION);
              setMessage(`A verification code was sent to ${email}.`);
              break;

            case LoginState.SUCCESS:
              const tokens = await wixClient.auth.getMemberTokensForDirectLogin(response.data.sessionToken);
              Cookies.set("refreshToken", JSON.stringify(tokens.refreshToken), { expires: 2 });
              wixClient.auth.setTokens(tokens);
              const user = await wixClient.members.getCurrentMember();
              const nickname = user?.member?.profile?.nickname;
              if (nickname) sessionStorage.setItem("nickname", nickname);
              router.push("/");
              break;

            case LoginState.OWNER_APPROVAL_REQUIRED:
              setMessage("Your account is pending approval.");
              break;

            default:
              setError("Unexpected registration response.");
              break;
          }
          return;

        case MODE.RESET_PASSWORD:
          if (!email) {
            setError("Email is required.");
            return;
          }

          if (lastResetRequest && Date.now() - lastResetRequest < 60000) {
            setError("Please wait before requesting another email.");
            return;
          }

          const redirectUrl =
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000/login"
              : "https://athamifashion.com/login";

          await wixClient.auth.sendPasswordResetEmail(email, redirectUrl);
          setLastResetRequest(Date.now());
          setMessage("Reset email sent. Check your inbox.");
          return;

        case MODE.RESET_PASSWORD_TOKEN:
          if (!resetToken) {
            setError("Invalid or expired reset token.");
            return;
          }

          if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
          }

          await wixClient.auth.resetPassword(resetToken, newPassword);
          setMessage("Password updated. Please log in.");
          setMode(MODE.LOGIN);
          return;

        case MODE.EMAIL_VERIFICATION:
          await wixClient.auth.processVerification({ verificationCode: emailCode });
          setMessage("Email verified. Please log in.");
          setMode(MODE.LOGIN);
          return;

        default:
          setError("Invalid form mode.");
          return;
      }

      if (mode === MODE.LOGIN && response) {
        switch (response.loginState) {
          case LoginState.SUCCESS:
            const tokens = await wixClient.auth.getMemberTokensForDirectLogin(response.data.sessionToken);
            await fetch("/api/set-token", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ refreshToken: tokens.refreshToken }),
            });

            wixClient.auth.setTokens(tokens);
            const user = await wixClient.members.getCurrentMember();
            const nickname = user?.member?.profile?.nickname;
            if (nickname) sessionStorage.setItem("nickname", nickname);
            router.push("/");
            break;

          case LoginState.FAILURE:
            setError("Invalid login credentials.");
            break;

          case LoginState.EMAIL_VERIFICATION_REQUIRED:
            setMode(MODE.EMAIL_VERIFICATION);
            setMessage(`Please verify your email. Code sent to ${email}.`);
            break;

          case LoginState.OWNER_APPROVAL_REQUIRED:
            setMessage("Your account is pending approval.");
            break;

          default:
            setError("Unexpected login response.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Head>
        <title>Login - AthamiFashion</title>
        <meta name="description" content="Securely login to your Athami Fashion account." />
      </Head>
      
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
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            {mode === MODE.EMAIL_VERIFICATION && (
              <>
                <div className="form_control">
                  <label>Verification Code</label>
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                  />
                </div>
              </>
            )}

            {(mode === MODE.LOGIN || mode === MODE.REGISTER) && (
              <div className="form_control">
                <label>Password</label>
                <div className="password_input">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? "Hide" : "Show"}
                </span>
                </div>
              </div>
            )}

            {mode === MODE.RESET_PASSWORD_TOKEN && (
              <>
                <div className="form_control">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="form_control">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm password"
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
    </>
  );
};

export default LoginPage;
