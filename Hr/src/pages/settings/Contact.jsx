import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";

const STORAGE_PREFIX = 'settings:contact:';
const contactInfo = [
  {
    title: 'Email',
    text: 'xyz@example.com',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6.5C3 5.67 3.67 5 4.5 5h15c.83 0 1.5.67 1.5 1.5v11c0 .83-.67 1.5-1.5 1.5h-15A1.5 1.5 0 013 17.5v-11z" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 6l-9 6L3 6" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'Phone',
    text: '+91 6234567890',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.86 19.86 0 01-3.07-8.63A2 2 0 014.11 2h3a2 2 0 012 1.72c.12 1.2.38 2.37.78 3.47a2 2 0 01-.45 2.11L9.91 11.09a16 16 0 006 6l1.79-1.79a2 2 0 012.11-.45c1.1.4 2.27.66 3.47.78A2 2 0 0122 16.92z" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'LinkedIn',
    text: 'uptoskills/profile',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 8a6 6 0 016 6v6h-4v-6a2 2 0 00-4 0v6h-4v-12h4v2" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 9h4v12H2z" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4" cy="4" r="2" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'Location',
    text: 'New Delhi, India',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2.5" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'Industry',
    text: 'Technology, information and internet',
    svg: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
];

const Contact = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setName(localStorage.getItem(STORAGE_PREFIX + 'name') || '');
    setEmail(localStorage.getItem(STORAGE_PREFIX + 'email') || '');
    setSubject(localStorage.getItem(STORAGE_PREFIX + 'subject') || '');
    setMessage(localStorage.getItem(STORAGE_PREFIX + 'message') || '');
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'name', name);
    localStorage.setItem(STORAGE_PREFIX + 'email', email);
    localStorage.setItem(STORAGE_PREFIX + 'subject', subject);
    localStorage.setItem(STORAGE_PREFIX + 'message', message);
  }, [name, email, subject, message]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      setStatus({ type: 'error', text: 'Please fill all fields.' });
      return;
    }

    setStatus({ type: 'loading', text: 'Sending...' });

    try {
      const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      const res = await fetch(`${base}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) throw new Error('Network error');

      setStatus({ type: 'success', text: 'Message sent — we will get back to you soon.' });
      setName(''); setEmail(''); setSubject(''); setMessage('');
      localStorage.removeItem(STORAGE_PREFIX + 'name');
      localStorage.removeItem(STORAGE_PREFIX + 'email');
      localStorage.removeItem(STORAGE_PREFIX + 'subject');
      localStorage.removeItem(STORAGE_PREFIX + 'message');
      setTimeout(() => setStatus(null), 3000);
    }
    catch (err) {
      setStatus({ type: 'error', text: 'Failed to send. Please try again later.' });
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[#f9fafb] dark:bg-slate-800 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center mb-6 mt-5">
          <button onClick={() => navigate(-1)} className="p-2 mr-4 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-100">
            <ArrowLeft />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Get In Touch</h1>
        </div>
        <p className="text-[#666] dark:text-slate-400 text-center mb-6">
          If you have any questions or need assistance? We're here to help you on your journey to success.
        </p>

        <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 rounded-2xl transition-colors duration-300">

          {/* Block 1: Contact Information */}
          <div className="shrink-0 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-6 rounded-xl shadow-sm transition-colors duration-300">
            <h2 className="text-xl font-semibold mb-9 text-gray-900 dark:text-slate-100">Contact Information</h2>
            {contactInfo.map((item, i) => (
              <div key={i} className="flex gap-4 mb-7 items-start">
                <div className="w-7 h-7 flex items-center justify-center">
                  {item.svg}
                </div>
                <div>
                  <h3 className="font-semibold text-[19px] mb-1.5 text-gray-800 dark:text-slate-200">{item.title}</h3>
                  <p className="m-0 text-[#666] dark:text-slate-400 text-[17px]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Block 2: Send Us a Message section */}
          {/* Matches Recognition.jsx form container style */}
          <div className="grow w-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
              Send Us a Message
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">
              We'll get back to you within 24 hours.
            </p>

            <form onSubmit={submit} className="" aria-labelledby="contact-form">

              {/* Name Input */}
              <div className="mb-5">
                <label htmlFor="name" className="block text-sm font-semibold mb-1 dark:text-slate-400">
                  Full Name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-gray-100 transition-colors"
                  placeholder="Enter your name"
                  aria-required="true"
                />
              </div>

              {/* Email Input */}
              <div className="mb-5">
                <label htmlFor="email" className="block text-sm font-semibold mb-1 dark:text-slate-400">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-gray-100 transition-colors"
                  placeholder="Enter your email"
                  aria-required="true"
                />
              </div>

              {/* Subject Input */}
              <div className="mb-5">
                <label htmlFor="subject" className="block text-sm font-semibold mb-1 dark:text-slate-400">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-gray-100 transition-colors"
                  placeholder="Subject"
                  aria-required="true"
                />
              </div>

              {/* Message Textarea */}
              <div className="mb-5">
                <label htmlFor="message" className="block text-sm font-semibold mb-1 dark:text-slate-400">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none dark:bg-slate-900 dark:border-slate-600 dark:text-gray-100 transition-colors"
                  placeholder="How can we help you?"
                  rows={4}
                  aria-required="true"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-3 mt-6">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                  aria-busy={status?.type === 'loading'}
                >
                  Send Message
                </motion.button>
                <div role="status" aria-live="polite" className={`text-sm ${status?.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {status?.text}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
