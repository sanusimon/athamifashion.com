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
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
};

const LoginPage = () => {

  const wixClient = useWixClient();
  const router = useRouter();
  

  const isLoggedIn = wixClient.auth.loggedIn();
 
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, router]); // Add router and isLoggedIn to dependencies
  // if(isLoggedIn){
  //   router.push("/")
  // }

  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailcode, setEmailCode] = useState("");
  const [mode, setMode] = useState(MODE.LOGIN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

 

  const formTitle =
    mode === MODE.LOGIN
      ? "Log in"
      : mode === MODE.REGISTER
      ? "Register"
      : mode === MODE.RESET_PASSWORD
      ? "Reset your password"
      : "Verify your Email";

  const buttonTitle =
    mode === MODE.LOGIN
      ? "Login"
      : mode === MODE.REGISTER
      ? "Register"
      : mode === MODE.RESET_PASSWORD
      ? "Reset"
      : "Verify";

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      let response;
      switch (mode) {
        case MODE.LOGIN:
          response = await wixClient.auth.login({ email, password });
          setMessage("Login successful!");
          break;

        case MODE.REGISTER:
          response = await wixClient.auth.register({
            email,
            password,
            profile: { nickname: username },
          });
          setMessage("Registration successful! Please verify your email.");
          break;

        case MODE.RESET_PASSWORD:
          response = await wixClient.auth.sendPasswordResetEmail(email, window.location.href);
          setMessage("Password reset email sent. Please check your e-mail");
          break;

        case MODE.EMAIL_VERIFICATION:
          response = await wixClient.auth.processVerification({
            verificationCode: emailcode,
          });
          setMessage("Email verified successfully!");
          break;

        default:
          throw new Error("Invalid mode");
      }

      console.log(response)

      switch(response?.loginState){
        case LoginState.SUCCESS:
            setMessage("Successfull! You are being redirected");
           
            const tokens = await wixClient.auth.getMemberTokensForDirectLogin(response.data.sessionToken)
      
        
      
            
            Cookies.set("refreshToken",JSON.stringify(tokens.refreshToken),{
              expires:2
            })
            
            wixClient.auth.setTokens(tokens);
      
            router.push("/");

            
            break;

            case LoginState.FAILURE:
              if(response.errorCode === "invalidEmail" || response.errorCode === "invalidPassword"){
                setError("Invalid email or password")
              }
              else if(response.errorCode === "emailAlreadyExist"){
                setError("Email already exist")
              }
              else if(response.errorCode === "resetPassword"){
                setError("You need to reset your password!")
              }{
                setError("Something went wrong")
              }
              case LoginState.EMAIL_VERIFICATION_REQUIRED:
                setMode(MODE.EMAIL_VERIFICATION);
              case LoginState.OWNER_APPROVAL_REQUIRED:
              setMessage("Your account is pending approval")

            default:
                break
      }



    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

   // AUTH WITH WIX-MANAGED AUTH

  // const wixClient = useWixClient();

  // const login = async () => {
  //   const loginRequestData = wixClient.auth.generateOAuthData(
  //     "http://localhost:3000"
  //   );

  //   console.log(loginRequestData);

  //   localStorage.setItem("oAuthRedirectData", JSON.stringify(loginRequestData));
  //   const { authUrl } = await wixClient.auth.getAuthUrl(loginRequestData);
  //   window.location.href = authUrl;
  // };


  return (
    <section className="login_page">
      <div className="container">
        {/* <button onClick={login}>login</button> */}
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
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
            )}

            {mode !== MODE.EMAIL_VERIFICATION ? (
              <div className="form_control">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="john@gmail.com"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            ) : (
              <div className="form_control">
                <label>Verification Code</label>
                <input
                  type="text"
                  placeholder="Code"
                  name="emailcode"
                  onChange={(e) => setEmailCode(e.target.value)}
                />
              </div>
            )}

            {(mode === MODE.LOGIN || mode === MODE.REGISTER) && (
              <div className="form_control">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  name="password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
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

            {message && <div className="text-green-600 text-sm">{message}</div>}
          </div>
        </form>
      </div>
    </section>
  );
};

export default LoginPage;
