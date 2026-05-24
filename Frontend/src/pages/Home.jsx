import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, logout } from "../services/auth.service";

const Home = () => {
  const [open, setOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsAuth(isAuthenticated());
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsAuth(false);
    navigate("/login");
  };

  return (
    <div>
      <nav className="flex flex-row justify-between md:px-6 ">
        <img src="image 2.svg" alt="" className="w-[150px] h-auto cursor-pointer" />
        <ul className="md:flex gap-9 justify-around text-[20px] py-5 hidden">
          <li className=" hover:text-blue-600 hover:bg-[#D9D9D9] transition-all duration-300 cursor-pointer">
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className=" hover:text-blue-600 transition-all duration-300 cursor-pointer">
            <Link to="/about">About</Link>
          </li>
          <li className=" hover:text-blue-600 transition-all duration-300 cursor-pointer">
            <Link to="/profile">Profile</Link>
          </li>
          <li className=" hover:text-blue-600 transition-all duration-300 cursor-pointer">
            <Link to="/event">Event</Link>
          </li>
          <li className=" hover:text-blue-600 transition-all duration-300 cursor-pointer">
            <Link to="/chat">Chat</Link>
          </li>
          <li className=" hover:text-blue-600 transition-all duration-300 cursor-pointer">
            {isAuth ? (
              <button onClick={handleLogout}>Logout</button>
            ) : (
              <Link to="/login">Sign-In</Link>
            )}
          </li>
        </ul>
        <div className="md:hidden pt-6 text-2xl" onClick={() => setOpen(!open)}>☰
          {open &&
            <ul >
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              <li><Link to="/event">Event</Link></li>
              <li><Link to="/chat">Chat</Link></li>
              <li>
                {isAuth ? (
                  <button onClick={handleLogout}>Logout</button>
                ) : (
                  <Link to="/login">Sign-In</Link>
                )}
              </li>
            </ul>
          }
        </div>
      </nav>
      <section className="flex md:flex-row justify-around flex-col gap-5">
        <div className="md:max-w-[45%] flex flex-col gap-5 text-[18px]">
          <div className="text-center pb-4 max-w-">
            <p className="text-3xl font-bold text-[#783625]">HRMS</p>
            <p>(Human Resource Management System)</p>
          </div>
          <div className="text-center pb-8">
            <p className="text-3xl font-bold text-[#783625]">About</p>
            <p>
              Our Human Resource Management System (HRMS) streamlines how
              organizations manage employees and teams. It integrates essential
              functions such as employee profiles, event planning, and internal
              communication, all within a single platform. With an intuitive
              interface and a well-organized layout, the HRMS enhances
              productivity and fosters transparency across the board. Its
              primary aim is to make HR tasks more efficient, faster, and
              dependable for everyone using it.
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#783625]">Features</p>
            <p>
              Our HRMS platform offers a comprehensive set of tools that make
              human resource management simpler and more effective. It covers
              everything from maintaining employee profiles to coordinating
              internal events, with every feature crafted for ease of use and
              maximum productivity. By promoting clear communication,
              transparent data management, and seamless workflow coordination,
              the system helps teams and organizations of all sizes handle HR
              processes more quickly and efficiently.
            </p>
          </div>
        </div>
        <div className="md:max-w-[40%]">
          <div className="bg-[#8EA4D0]  rounded-2xl max-w-full cursor-pointer">
            <img src="image 5.svg" alt="" className="p-6 w-full" />
          </div>
          < p className="text-center text-[20px]">Access our integrated HRMS tools through the download button</p>
          <div className="flex md:flex-row md:justify-around gap-1 flex-col justify-center">
            <button className="text-blue-600 cursor-pointer bg-[#D9D9D9] h-auto max-w-[200px] mx-auto px-2 md:my-9 my-4 rounded-2xl
            focus:outline-none hover:text-black ">Click For Download</button>

            <img src="image.svg" alt="" className="p-4 min-w-[200px] my-auto bg-[#D9D9D9] rounded-2xl mx-auto" />

          </div>
          <p className="text-center text-[20px]">for extended functionality and seamless management.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;