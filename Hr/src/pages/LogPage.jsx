import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LogPage() {
  const navigate = useNavigate();
  useEffect(() => {
    // Clear any existing session to prevent stale data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("Iemail");
    const passwordInput = document.getElementById("Ipassword");
    const togglePassword = document.getElementById("togglePassword");
    const emailError = document.getElementById("IemailError");
    const passwordError = document.getElementById("IpasswordError");

    togglePassword.addEventListener("click", () => {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      togglePassword.textContent = type === "password" ? "Show" : "Hide";
    });

    const submitHandler = async (e) => {
      e.preventDefault();
      let isValid = true;

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailInput.value.trim())) {
        emailError.classList.remove("hidden");
        isValid = false;
      } else {
        emailError.classList.add("hidden");
      }

      // Simplified validation: just check minimum 8 characters to match backend
      const passwordPattern = /.{8,}/;

      if (!passwordPattern.test(passwordInput.value.trim())) {
        passwordError.classList.remove("hidden");
        isValid = false;
      } else {
        passwordError.classList.add("hidden");
      }

      if (isValid) {
        try {
          const { login } = await import("../services/auth.service.js");
          await login(emailInput.value.trim(), passwordInput.value.trim());
          alert("Login successful!");
          form.reset();
          navigate("/dashboard");
        } catch (error) {
          alert(error.message);
        }
      }
    };

    form.addEventListener("submit", submitHandler);

    return () => {
      togglePassword.replaceWith(togglePassword.cloneNode(true));
      form.replaceWith(form.cloneNode(true));
      form.removeEventListener("submit", submitHandler);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center font-[Poppins] px-4 md:px-12 lg:px-24 py-12 bg-gray-50 dark:bg-[#020839]">
      <button
        onClick={() => {
          document.documentElement.classList.toggle("dark");
        }}
        className="
    absolute top-4 right-4
    px-4 py-2
    rounded-full
    bg-white text-black
    dark:bg-black dark:text-white
    border border-gray-300 dark:border-gray-500
    shadow-md
    z-50
  "
      >
        toggle theme
      </button>

      <div className="relative z-10 w-full max-w-5xl bg-white dark:bg-[#2C50AB] rounded-lg shadow-xl overflow-hidden min-h-[75vh] flex flex-col md:flex-row">


        {/* WATERMARK inside card — now moved up */}
        <img
          src="flower1.png"
          alt="watermark"
          className="
            absolute left-1/2 
            top-1/3
            -translate-x-1/2
            -translate-y-1/2
            w-3/3 
            object-contain 
            opacity-15 
            pointer-events-none 
            select-none 
            md:hidden
          "
          aria-hidden="true"
        />


        {/* Left side - Login form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6 text-black dark:text-white">
            Login in
          </h3>

          <div className="space-y-4">
            {/* GOOGLE LOGIN */}
            <button
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-full bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() =>
                window.open("https://google.com", "popupWindow", "width=600,height=600")
              }
            >
              <img src="googleLogo.png" alt="Google logo" className="w-5 h-5" />
              <span>Continue With Google</span>
            </button>

            {/* FACEBOOK LOGIN */}
            <button
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-full bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() =>
                window.open("https://facebook.com", "popupWindow", "width=600,height=600")
              }
            >
              <img src="facebookLogo.png" alt="Facebook logo" className="w-5 h-5" />
              <span>Continue With Facebook</span>
            </button>

            <div className="flex items-center my-4">
              <div className="grow h-px bg-gray-300" />
              <span className="mx-4 text-gray-500 dark:text-[#E5E7EB]">or</span>
              <div className="grow h-px bg-gray-300" />
            </div>

            {/* FORM */}
            <form id="loginForm" className="flex flex-col gap-3">
              <label className="text-xs text-gray-700  dark:text-[#E5E7EB] font-bold">Email Address</label>
              <input
                type="email"
                id="Iemail"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#020839] dark:text-white dark:border-[#88AAFF]"
                autoComplete="email"
              />
              <p id="IemailError" className="hidden text-red-500 text-xs mt-1">
                Please enter a valid email address.
              </p>

              <label className="text-xs text-gray-700 font-bold">Password</label>

              <div className="relative">
                <input
                  type="password"
                  id="Ipassword"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  autoComplete="current-password"
                />
                <span
                  id="togglePassword"
                  className="absolute right-3 top-2 cursor-pointer text-xs text-gray-600"
                >
                  Show
                </span>
              </div>
              <p id="IpasswordError" className="hidden text-red-500 text-xs mt-1">
                Password must be at least 8 characters long.
              </p>

              <div className="flex justify-end">
                <a href="/" className="text-xs text-gray-500 hover:underline">
                  forget password
                </a>
              </div>

              <button className="mt-4 w-full rounded-full bg-blue-600 text-white px-5 py-2 text-sm font-semibold hover:bg-blue-700">
                Log in
              </button>

              <div className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/Signup" className="text-blue-400">
                  Create account
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Right side - Desktop illustration */}
        <div className="w-full md:w-1/2 hidden md:flex items-center justify-center p-8">
          <img
            src="flower1.png"
            alt="Flower illustration"
            className="w-full max-w-md object-contain"
          />
        </div>

      </div>
    </div>
  );
}