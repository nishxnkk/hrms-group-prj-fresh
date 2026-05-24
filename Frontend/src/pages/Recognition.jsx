import React, { useRef, useState, useEffect } from "react";
import coin from "../assets/coin.png";
import medal from "../assets/medal.png";
import trophy from "../assets/trophy.png";
import { focusField } from "../utils/formValidation";
import toast from 'react-hot-toast';
import { usePrompt, PromptDialog } from '../components/ui/PromptDialog';

export default function RecognitionPage() {
  const { prompt, dialogProps: promptDialogProps } = usePrompt();
  const [selectedSection, setSelectedSection] = useState("recipient");
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const recipientSearchRef = useRef(null);
  const appreciationTypeRef = useRef(null);
  const achievementRef = useRef(null);

  const fetchData = async () => {
    try {
      // Fetch Users
      const userRes = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const userData = await userRes.json();
      setUsers(userData.users || []);

      // Fetch Leaderboard
      const leaderboardRes = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/appreciations/leaderboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const leaderboardData = await leaderboardRes.json();
      const loggedInUser = JSON.parse(localStorage.getItem("user"));

      if (leaderboardData.success) {
        const mappedLeaderboard = leaderboardData.data.map(user => {
          const colors = ["bg-yellow-100 text-yellow-800", "bg-blue-100 text-blue-800", "bg-purple-200 text-purple-800", "bg-gray-100 text-gray-800", "bg-green-100 text-green-800"];
          const colorClass = colors[user.id % colors.length];
          const [avatarColor, textColor] = colorClass.split(" text-");

          return {
            ...user,
            isCurrentUser: loggedInUser && user.id === loggedInUser.id,
            avatarColor: avatarColor.trim(),
            textColor: `text-${textColor.trim()}`
          };
        });
        setLeaderboard(mappedLeaderboard);
      }

      // Fetch Recent Recognitions
      const appRes = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/appreciations?source=recognition`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const appData = await appRes.json();
      if (appData.success) {
        const mappedRecognitions = appData.data.map(item => ({
          id: item.id,
          name: item.recipient_name, // Display Recipient Name
          time: new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          message: item.message,
          points: `+${item.points} points`,
          badge: item.category,
          avatar: item.recipient_profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.recipient_name)}&background=random`,

          // Extra fields for recent recognition card
          created_at: item.created_at,
          sender_name: item.sender_name,
          user_liked: item.user_liked,
          likes_count: item.likes_count,
          recipient_name: item.recipient_name,
        }));
        setRecognitions(mappedRecognitions);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  const [formData, setFormData] = useState({
    recipientName: "",
    department: "IT & Systems",
    employeeId: "",
    jobTitle: "",

    appreciationType: "",
    achievement: "",
    appreciationDate: "",

    contextMessage: "",
    visibility: "",
    approval: "manager"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedRecipientId) {
      toast.error("Please select a valid recipient from the list");
      setSelectedSection("recipient");
      focusField(recipientSearchRef.current);
      return;
    }
    if (!formData.appreciationType) {
      toast.error("Please select a type of appreciation");
      setSelectedSection("appreciation");
      window.setTimeout(() => focusField(appreciationTypeRef.current), 0);
      return;
    }
    if (!formData.achievement.trim()) {
      toast.error("Please describe the specific achievement");
      setSelectedSection("appreciation");
      window.setTimeout(() => focusField(achievementRef.current), 0);
      return;
    }


    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (loggedInUser && selectedRecipientId === loggedInUser.id) {
      toast.error("You cannot appreciate yourself");
      return;
    }
    try {
      const payload = {
        recipient_id: Number(selectedRecipientId), // MUST be number
        title: `${formData.appreciationType} Appreciation`,
        category: formData.appreciationType,
        message: `${formData.achievement}${formData.contextMessage ? "\n\n" + formData.contextMessage : ""}`,
        emoji: "🎉",
        points: 0, // You might want to assign points based on type later
        source: "recognition"
      };

      console.log("Submitting payload:", payload);

      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/appreciations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` // REQUIRED
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        return;
      }
      const data = await res.json();
      console.log("RESPONSE:", data);
      if (!res.ok) {
        throw new Error(data.message || "Backend error");
      }

      toast.success("Appreciation sent successfully");

      // Refresh the data to show the new appreciation and updated leaderboard
      fetchData();

      // Reset relevant form fields
      setFormData(prev => ({
        ...prev,
        recipientName: "",
        employeeId: "",
        appreciationType: "",
        achievement: "",
        contextMessage: ""
      }));
      setSelectedRecipientId(null);

    } catch (err) {
      console.error("FULL ERROR:", err);
      toast.error(err.message || "Something went wrong");
    }
  };


  const renderRecipientForm = () => (
    <>

      <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-400">
        Select the Recipient
      </h2>
      <p className="text-gray-500 mb-6 dark:text-slate-400">
        Choose a colleague you'd like to appreciate
      </p>

      {/* Recipient Name */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-1 dark:text-slate-400">
          Recipient
        </label>

        <input
          ref={recipientSearchRef}
          type="text"
          value={formData.recipientName}
          onChange={(e) => {
            const value = e.target.value;
            setFormData(prev => ({ ...prev, recipientName: value }));

            const matches = users.filter(user =>
              user.fullname.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredUsers(matches);
          }}
          placeholder="Enter recipient name"
          className="w-full p-3 border rounded-lg dark:bg-slate-900 dark:text-gray-100"
        />
        {filteredUsers.length > 0 && (
          <ul className="border rounded-lg mt-1 bg-white max-h-40 overflow-y-auto dark:bg-slate-900 dark:text-gray-100">
            {filteredUsers.map(user => (
              <li
                key={user.id}
                onClick={() => {
                  setFormData(prev => ({ ...prev, recipientName: user.fullname }));
                  setSelectedRecipientId(user.id);
                  setFilteredUsers([]);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-900 dark:hover:text-gray-100 cursor-pointer"
              >
                {user.fullname}
              </li>
            ))}
          </ul>
        )}

      </div>


      {/* Department */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1 dark:text-slate-400">
          Department/Team
        </label>
        <select
          name="department"
          value={formData.department}
          onChange={handleChange}
          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 dark:border-slate-600 dark:text-gray-100 dark:bg-slate-900"
        >
          <option value="IT & Systems">IT & Systems</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
          <option value="Marketing">Marketing</option>
          <option value="Operations">Operations</option>
        </select>
      </div>

      {/* Employee ID + Job Title */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-1 dark:text-slate-400">
            Employee ID
          </label>
          <input
            type="text"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            placeholder="Enter ID"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 dark:border-slate-600 dark:text-gray-100 dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 dark:text-slate-400">
            Job Title
          </label>
          <select
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 dark:border-slate-600 dark:text-gray-100 dark:bg-slate-900"
          >
            <option value="">Select</option>
            <option value="Software Engineer">Software Engineer</option>
            <option value="Senior Developer">Senior Developer</option>
            <option value="Team Lead">Team Lead</option>
            <option value="Manager">Manager</option>
            <option value="Director">Director</option>
          </select>
        </div>
      </div>



    </>
  );

  const renderAppreciationForm = () => (
    <>
      <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-400">
        Reason for Appreciation
      </h2>
      <p className="text-gray-500 dark:text-slate-400 mb-6">
        Tell us why your colleague deserves appreciation
      </p>

      {/* Type of Appreciation */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-1 dark:text-slate-400">
          Type of Appreciation
        </label>
        <select
          ref={appreciationTypeRef}
          name="appreciationType"
          value={formData.appreciationType}
          onChange={handleChange}
          className="w-full p-3 border border-gray-200 dark:border-slate-600 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-500 dark:bg-slate-900"
        >
          <option value="">Select</option>
          <option value="Teamwork">Teamwork</option>
          <option value="Leadership">Leadership</option>
          <option value="Innovation">Innovation</option>
          <option value="Outstanding Performance">Outstanding Performance</option>
        </select>
      </div>

      {/* Specific Achievement */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-1 dark:text-slate-400">
          Specific Achievement
        </label>
        <textarea
          ref={achievementRef}
          name="achievement"
          value={formData.achievement}
          onChange={handleChange}
          rows="3"
          className="w-full p-3 border border-gray-200 dark:border-slate-600 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-400"
          placeholder="Describe the action"
        />
      </div>

      {/* Date + Attachment */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1 dark:text-slate-400">
            Date
          </label>
          <input
            type="date"
            className="w-full p-3 border border-gray-200 dark:border-slate-600 dark:text-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 dark:text-slate-400">
            Attachments (Optional)
          </label>
          <label className="flex items-center justify-center gap-2 w-full p-3 border border-dashed border-purple-400 rounded-lg cursor-pointer text-purple-600 font-medium hover:bg-purple-50 dark:border-slate-600 dark:text-purple-600 dark:hover:bg-slate-800 dark:hover:text-purple-400">
            Choose a File
            <input type="file" className="hidden" />
          </label>
        </div>
      </div>
    </>
  );


  const renderDetailsForm = () => (
    <>
      <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-400">
        Add Context (Optional)
      </h2>
      <p className="text-gray-500 mb-6 dark:text-slate-400">
        Share any additional details or a personal message
      </p>

      {/* Message */}
      <div className="mb-5 dark:text-slate-400">
        <label className="block text-sm font-semibold mb-1 dark:text-slate-400">
          Message
        </label>
        <textarea
          name="contextMessage"
          value={formData.contextMessage}
          onChange={handleChange}
          maxLength={150}
          rows="4"
          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 dark:border-slate-600 dark:focus:ring-purple-400 dark:text-slate-100"
          placeholder="Describe the action"
        />
        <div className="text-xs text-gray-400 text-right dark:text-slate-300 mt-1">
          0/150
        </div>
      </div>

      {/* Visibility */}
      <div className="mb-5 dark:text-slate-400">
        <label className="block text-sm font-semibold mb-1 dark:text-slate-400">
          Choose who can see the appreciation
        </label>
        <select
          name="visibility"
          className="w-full p-3 dark:bg-slate-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 dark:border-slate-600 dark:focus:ring-purple-400 dark:text-slate-100"
        >
          <option value="">Select</option>
          <option value="public">Public</option>
          <option value="team">Team Only</option>
          <option value="private">Private</option>
        </select>
      </div>

      {/* Approval options */}
      <div className="space-y-2 text-sm dark:text-slate-400">
        <label className="flex items-center gap-2 dark:text-slate-400">
          <input
            type="radio"
            name="approval"
            value="manager"
            defaultChecked
          />
          This post will be sent to admin/manager for approval
        </label>

        <label className="flex items-center gap-2 dark:text-slate-400">
          <input type="radio" name="approval" value="notify" />
          Send notification to the recipient
        </label>

        <label className="flex items-center gap-2 dark:text-slate-400">
          <input type="radio" name="approval" value="comments" />
          Allow others to comment or add to the appreciation
        </label>
      </div>
    </>
  );

  // const [appreciations, setAppreciations] = useState([]); // Removed duplicate state
  // const [isAdmin, setIsAdmin] = useState(false); // Declared above if needed? Wait, let's check.
  // Actually isAdmin is used later, let's just keep isAdmin if it wasn't duplicated. 
  // I need to check where isAdmin is first declared. It is NOT declared at top.
  // So I should keep isAdmin but remove appreciations.

  const [isAdmin, setIsAdmin] = useState(false);

  const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  const toggleLike = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${base}/api/appreciations/${id}/like`, { method: 'POST', headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) {
        console.error('like failed', res.status);
        return;
      }
      // Refresh list
      fetchData();
      // Notify other pages
      try { window.dispatchEvent(new CustomEvent('activity:updated')); } catch (e) { }
    } catch (err) {
      console.error('Error toggling like', err);
    }
  };

  const grantPoints = async (userId) => {
    const amtStr = await prompt('Enter points to grant (positive integer)', '');
    const amt = parseInt(amtStr, 10);
    if (!amt || isNaN(amt)) return;
    const reason = await prompt('Optional reason for points', '') || '';
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${base}/api/admin/users/${userId}/points`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ amount: amt, reason }) });
      if (!res.ok) { toast.error('Failed to grant points'); return; }
      fetchData();
      window.dispatchEvent(new CustomEvent('activity:updated'));
      toast.success('Points granted');
    } catch (err) { console.error('Grant points failed', err); toast.error('Failed to grant points'); }
  };



  return (
    <div>
      <PromptDialog {...promptDialogProps} />
      <div className="p-6">
        {/* MAIN GRID */}
        <div className="grid grid-cols-[340px_1fr] gap-8">
          {/* LEFT SIDEBAR */}
          <div className="space-y-4 min-h-screen">
            {/* Recipient */}
            {["recipient", "appreciation", "details"].map((section) => (
              <div
                key={section}
                onClick={() => setSelectedSection(section)}
                className={`p-4 rounded-xl cursor-pointer border transition ${selectedSection === section
                  ? "border-purple-500 bg-white dark:bg-slate-900 shadow-sm"
                  : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900"
                  }`}
              >
                <h3
                  className={`text-sm font-semibold ${selectedSection === section
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-gray-900 dark:text-slate-100"
                    }`}
                >
                  {section === "recipient"
                    ? "Recipient"
                    : section === "details"
                      ? "Other Details"
                      : "Appreciation For"}
                </h3>

                <p className="text-xs text-gray-500 dark:text-slate-100 mt-1">
                  {section === "recipient" &&
                    "Who would you like to appreciate? Enter their name or select from colleagues."}
                  {section === "appreciation" &&
                    "What's the reason for appreciation? Mention specific achievement."}
                  {section === "details" &&
                    "Visibility, notifications, comments, and more options."}
                </p>
              </div>
            ))}

            {/* Leaderboard */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Leaderboard
              </h3>

              <div className="space-y-2">
                {users.slice(0, 5).map((user, idx) => {
                  const rowClasses = user.id === JSON.parse(localStorage.getItem('user') || '{}').id
                    ? "border border-purple-500 bg-purple-50 dark:bg-purple-50"
                    : "border border-transparent bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700";

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${rowClasses}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-800">
                          {idx + 1}
                        </div>

                        <div
                          className={`h-9 w-9 flex items-center justify-center rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200`}
                        >
                          {user.fullname
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>

                        <div>
                          <p
                            className={`text-xs font-semibold ${user.id === JSON.parse(localStorage.getItem('user') || '{}').id
                              ? "text-purple-700"
                              : "text-gray-900 dark:text-slate-200"
                              }`}
                          >
                            {user.fullname}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400">
                            {user.points?.toLocaleString() || 0} points
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {idx === 0 && <span className="text-lg">👑</span>}
                        {user.id === JSON.parse(localStorage.getItem('user') || '{}').id ? (
                          <span className="rounded-full bg-purple-600 px-2 py-1 text-[10px] font-semibold text-white">
                            You
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">#{idx + 1}</span>
                            {isAdmin && (
                              <button onClick={() => grantPoints(user.id)} className="ml-2 text-sm bg-blue-600 text-white px-2 py-1 rounded-md">Grant</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="space-y-6">
            {/* TOP CARDS */}
            <div className="grid grid-cols-3 gap-4">
              {/* 1 — Total Points */}
              <div className="flex items-center justify-between h-24 rounded-2xl px-5 bg-linear-to-r from-blue-900 to-blue-700 text-white shadow">
                <div className="flex flex-col">
                  <span className="text-sm opacity-90">Total Points</span>
                  <span className="text-2xl font-semibold">{(JSON.parse(localStorage.getItem('user') || '{}').points || 0).toLocaleString()}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <img src={coin} alt="Coin Icon" className="w-12 h-12" />
                </div>
              </div>

              {/* 2 — Badges Earned */}
              <div className="flex items-center justify-between h-24 rounded-2xl px-5 bg-linear-to-r from-yellow-500 to-yellow-300 text-white shadow">
                <div>
                  <span className="text-sm opacity-90">Badges Earned</span>
                  <span className="text-2xl font-semibold block">12</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-300 flex items-center justify-center">
                  <img src={medal} alt="Medal Icon" className="w-12 h-12" />
                </div>
              </div>

              {/* 3 — Current Rank */}
              <div className="flex items-center justify-between h-24 rounded-2xl px-5 bg-linear-to-r from-green-500 to-green-300 text-white shadow">
                <div>
                  <span className="text-sm opacity-90">Current Rank</span>
                  <span className="text-2xl font-semibold block">{(() => {
                    try {
                      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                      if (!localUser || !localUser.id || !users || users.length === 0) return '#-';
                      const idx = users.findIndex(u => u.id === localUser.id);
                      return idx >= 0 ? `#${idx + 1}` : '#-';
                    } catch (e) { return '#-'; }
                  })()}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-200 flex items-center justify-center">
                  <img src={trophy} alt="Trophy Icon" className="w-12 h-12" />
                </div>
              </div>
            </div>

            {/* FORM CARD */}
            <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-6 border-gray-200 dark:border-slate-700  shadow transition-all">
              {selectedSection === "recipient" && renderRecipientForm()}
              {selectedSection === "appreciation" && renderAppreciationForm()}
              {selectedSection === "details" && renderDetailsForm()}

              {/* FOOTER BUTTONS */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    if (selectedSection === "recipient") {
                      setSelectedSection("appreciation");
                      return;
                    }

                    if (selectedSection === "appreciation") {
                      setSelectedSection("details");
                      return;
                    }

                    // details step
                    handleSubmit();
                  }}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {selectedSection === "details" ? "Send Appreciation" : "Next step"}
                </button>
              </div>
            </div>


            {/* RECENT RECOGNITION */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-600 mb-3">
                Recent Recognition
              </h3>

              <div className="space-y-3">
                {recognitions.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">No appreciations yet.</p>
                ) : (
                  recognitions.map((a) => (
                    <div key={a.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center mb-2">
                        <div className="w-9 h-9 rounded-full mr-2.5 bg-gray-200 dark:bg-slate-500 flex items-center justify-center">{a.sender_name?.split(' ').map(n => n[0]).join('')}</div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-white">{a.sender_name}</h4>
                          <span className="text-xs text-gray-500 dark:text-slate-400">{new Date(a.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-white mb-2.5">{a.message}</p>

                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleLike(a.id)} className={`px-3 py-1 rounded-md ${a.user_liked ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          {a.user_liked ? 'Liked' : 'Like'} • {a.likes_count}
                        </button>
                        <span className="text-sm text-gray-500 dark:text-slate-400">{a.recipient_name}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >

  );
}
