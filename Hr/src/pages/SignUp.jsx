import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [gender, setGender] = useState('');
  const [profilePicture, setProfilePicture] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ name: "", email: "", password: "", designation: "", phone: "" });

  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#E8E8F0';
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  const validate = () => {
    const newErrors = { name: "", email: "", password: "", designation: "", phone: "" };
    if (name.trim().length < 3) newErrors.name = "Name must be at least 3 characters long.";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) newErrors.email = "Please enter a valid email address.";
    if (password.trim().length < 8) newErrors.password = "Password must be at least 8 characters long.";
    if (designation.trim() === "") newErrors.designation = "Please select your designation.";
    const phonePattern = /^[0-9+\-()\s]{7,20}$/;
    if (phone && !phonePattern.test(phone.trim())) newErrors.phone = "Please enter a valid phone number.";
    setErrors(newErrors);
    return !newErrors.name && !newErrors.email && !newErrors.password && !newErrors.designation && !newErrors.phone;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const robot = document.getElementById("robot");
    const isValid = validate();
    if (!robot || !robot.checked) {
      alert("Please confirm you are not a robot.");
      return;
    }
    if (isValid) {
      try {
        // upload profile file first if present
        let uploadedPath = profilePicture;
        if (profileFile) {
          setUploading(true);
          try {
            const form = new FormData();
            form.append('profile', profileFile);
            const upRes = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users/upload-profile`, {
              method: 'POST',
              body: form,
            });
            const upData = await upRes.json();
            if (upRes.ok && upData.path) {
              uploadedPath = upData.path;
            } else {
              console.warn('Upload failed, continuing without profile image');
            }
          } catch (err) {
            console.error('Upload failed', err);
          } finally {
            setUploading(false);
          }
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullname: name,
            email: email,
            password: password,
            designation: designation,
            job_title: jobTitle,
            department: department,
            phone: phone,
            date_of_joining: dateOfJoining || null,
            employee_id: employeeId,
            profile_picture: uploadedPath,            gender: gender || 'Not Specified',            status: "ACTIVE"
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Success - status 201
          alert("✅ Account created successfully!");

          // Auto-login logic
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          setName("");
          setEmail("");
          setPassword("");
          setDesignation("");
          setErrors({ name: "", email: "", password: "", designation: "" });
          if (typeof robot !== "undefined") robot.checked = false;

          // Redirect to dashboard
          window.location.href = "/dashboard";
        } else {
          // Error - status 400 or 500
          if (response.status === 400 && data.message === "User already exists") {
            // Duplicate email
            setErrors({ ...errors, email: "This email is already registered. Please use a different email or log in." });
            alert("❌ This email is already registered!");
          } else {
            // Other errors
            alert(`❌ Error: ${data.message || "Failed to create account"}`);
          }
        }
      } catch (error) {
        console.error("Signup error:", error);
        alert("❌ Network error. Please check if the backend server is running.");
      }
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center font-[Poppins] px-4 md:px-12 lg:px-24 py-12">
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-xl overflow-hidden min-h-[75vh]">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-2/3 p-6 sm:p-8 md:p-16 relative">
            <img
              src="flower.png"
              alt="flower background"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none md:hidden w-[75%]"
            />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1 lowercase text-black relative z-10">
              create an account
            </h2>
            <p className="mb-4 text-sm sm:text-base text-gray-700 relative z-10">
              already have an account?{' '}
              <Link to="/login" className="text-black font-bold">
                log in
              </Link>
            </p>

            <form id="createAccountForm" className="space-y-4 relative z-10" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-1 text-black">Name</label>
                <input id="name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full max-w-[400px] border border-gray-300 rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" placeholder="Your name" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="jobTitle" className="block text-sm font-semibold mb-1 text-black">Job title</label>
                <input id="jobTitle" name="jobTitle" type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full max-w-[400px] border border-gray-300 rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" placeholder="e.g. Senior Engineer" />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-semibold mb-1 text-black">Department</label>
                <input id="department" name="department" type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full max-w-[400px] border border-gray-300 rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" placeholder="e.g. Engineering" />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold mb-1 text-black">Phone</label>
                <input id="phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full max-w-[400px] border border-gray-300 rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" placeholder="Optional" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="dateOfJoining" className="block text-sm font-semibold mb-1 text-black">Date of joining</label>
                <input id="dateOfJoining" name="dateOfJoining" type="date" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} className="w-full max-w-[400px] border border-gray-300 rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" />
              </div>

              <div>
                <label htmlFor="employeeId" className="block text-sm font-semibold mb-1 text-black">Employee ID</label>
                <input id="employeeId" name="employeeId" type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full max-w-[400px] border border-gray-300 rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" placeholder="Optional" />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-semibold mb-1 text-black">Gender</label>
                <select id="gender" name="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="w-full max-w-[400px] border border-gray-300 rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base">
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="profilePicture" className="block text-sm font-semibold mb-1 text-black">Profile picture (optional)</label>
                <input id="profilePicture" name="profilePicture" type="file" accept="image/*" onChange={(e) => setProfileFile(e.target.files && e.target.files[0])} className="w-full max-w-[400px]" />
                {profileFile && <p className="text-xs text-gray-700 mt-1">Selected: {profileFile.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-1 text-black">Email address</label>
                <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full max-w-[400px] border border-gray-300 rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" placeholder="you@example.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="designation" className="block text-sm font-semibold mb-1 text-black">Designation</label>
                <select id="designation" name="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full max-w-[400px] border border-gray-300 rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base">
                  <option value="">Select designation</option>
                  <option value="HR">HR</option>
                  <option value="Developer">Developer</option>
                  <option value="Manager">Manager</option>
                  <option value="Designer">Designer</option>
                  <option value="Intern">Intern</option>
                  <option value="Other">Other</option>
                </select>
                {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-1 text-black">Password</label>
                <div className="relative w-full max-w-[400px]">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs sm:text-sm cursor-pointer select-none"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                <p className="text-xs text-gray-600 mt-1">use 8 or more characters with a mix of letters, numbers, and symbols</p>
              </div>

              <p className="text-sm text-gray-700">by creating an account, you agree to our <span className="font-semibold">terms of use</span> and <span className="font-semibold">privacy policy</span></p>

              <div className="flex items-center space-x-2">
                <input id="robot" type="checkbox" className="h-4 w-4 accent-green-500" />
                <label htmlFor="robot" className="text-sm text-black font-medium cursor-pointer">i am not a robot</label>
              </div>

              <button type="submit" className="w-full max-w-[400px] bg-[#4a2cf0] text-white py-2 rounded-md font-medium hover:bg-[#3a20d1] transition-all text-sm sm:text-base">create account</button>

              <p className="text-sm text-gray-800 text-center w-full max-w-[400px]">already have an account? <Link to="/login" className="font-bold text-black">log in</Link></p>
            </form>
          </div>

          <div className="w-full md:w-1/2 flex items-center justify-end p-6 md:p-10 bg-transparent">
            <img
              src="flower.png"
              alt="flower illustration"
              className="hidden md:block w-full md:max-w-[2800px] lg:max-w-[3200px] xl:max-w-[3800px] object-contain mr-0 scale-[1.4]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp