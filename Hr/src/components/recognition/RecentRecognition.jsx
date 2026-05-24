import React, { useState } from "react";

function RecentRecognition() {
  const [recipient, setRecipient] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* 2 COLUMN FORM */}
      <div className="grid grid-cols-[150px_1fr] gap-6 bg-white p-6 rounded-xl shadow">

        {/* LEFT LABELS */}
        <div className="flex flex-col gap-6">
          <div className="py-2 font-semibold text-gray-700">Recipient</div>
          <div className="py-2 font-semibold text-gray-700">Appreciation For</div>
          <div className="py-2 font-semibold text-gray-700">Other Details</div>
        </div>

        {/* RIGHT INPUTS */}
        <div className="flex flex-col gap-6">

          {/* Recipient */}
          <div>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option>Select Recipient</option>
              <option>Employee A</option>
              <option>Employee B</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option>Select Reason</option>
              <option>Teamwork</option>
              <option>Innovation</option>
            </select>
          </div>

          {/* Details */}
          <div>
            <textarea
              placeholder="Write your message..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-purple-500"
            />
          </div>

        </div>
      </div>

      {/* BOTTOM 2 GRID BOXES */}
      <div className="grid grid-cols-2 gap-6 mt-8">

        {/* Leaderboard Box */}
        <div className="p-6 bg-white rounded-xl shadow border">
          <h3 className="text-lg font-semibold text-blue-900">Leaderboard</h3>
        </div>

        {/* Recent Recognition */}
        <div className="p-6 bg-white rounded-xl shadow border">
          <h3 className="text-lg font-semibold text-blue-900">Recent Recognition</h3>
        </div>

      </div>
    </div>
  );
}

export default RecentRecognition;
