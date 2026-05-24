import React, { useRef, useState, useEffect } from 'react';
import { getAllEvents, createEvent as createEventAPI, registerForEvent, deleteEvent as deleteEventAPI, getUserEvents } from '../services/event.service';
import { focusFirstInvalid, handleInvalidCapture } from '../utils/formValidation';

const ProfessionalEventsPage = () => {
  // --- 1. STATE DEFINITIONS (Moved INSIDE the component) ---
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const joinFormRef = useRef(null);
  const createFormRef = useRef(null);

  // Join Form State
  const [joinForm, setJoinForm] = useState({
    name: '',
    email: '',
    company: '',
    position: ''
  });

  // Create Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    location: '',
    description: '',
    event_date: '',
    start_time: '09:00',
    end_time: '17:00',
    event_type: 'Conference',
    max_attendees: 100
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- 2. EFFECTS ---
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      // setIsAdmin(user.role === 'Admin');  
      setIsAdmin(true); // I forced it to true so that i can see the button here 
      setCurrentUser(user);
    }
  }, []);

  // Load joined events
  const fetchAndMergeUserEvents = async () => {
    try {
      const res = await getUserEvents();
      const evs = Array.isArray(res) ? res : (res.events || res.data || []);
      const ids = (evs || []).map(e => e.id).filter(Boolean);
      const local = JSON.parse(localStorage.getItem('joinedEvents') || '[]');
      const merged = Array.from(new Set([...(ids || []), ...(Array.isArray(local) ? local : [])]));
      setJoinedEvents(merged);
      localStorage.setItem('joinedEvents', JSON.stringify(merged));
    } catch (err) {
      console.warn('Failed to load user events', err);
      const local = JSON.parse(localStorage.getItem('joinedEvents') || '[]');
      if (Array.isArray(local) && local.length) setJoinedEvents(local);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchAndMergeUserEvents();
    }
    const onEventsUpdated = () => {
      if (currentUser && currentUser.id) fetchAndMergeUserEvents();
    };
    window.addEventListener('events:updated', onEventsUpdated);
    return () => window.removeEventListener('events:updated', onEventsUpdated);
  }, [currentUser]);

  // Fetch events
  const [professionalEvents, setProfessionalEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const events = await getAllEvents();
      setProfessionalEvents(events);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. HELPER FUNCTIONS ---
  const getEventCategory = (eventDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDateObj = new Date(eventDate);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj >= today ? 'upcoming' : 'past';
  };

  const filteredEvents = activeTab === 'all'
    ? professionalEvents
    : professionalEvents.filter(event => getEventCategory(event.event_date) === activeTab);

  // --- 4. HANDLERS ---
  const handleJoinClick = (event) => {
    setSelectedEvent(event);
    setShowJoinModal(true);
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (focusFirstInvalid(joinFormRef.current)) return;
    if (!selectedEvent) return;

    if (isEventJoined(selectedEvent.id)) {
      alert('You are already registered for this event');
      setShowJoinModal(false);
      return;
    }

    try {
      await registerForEvent(selectedEvent.id, "Confirmed");
      setJoinedEvents(prev => {
        const next = Array.from(new Set([...(prev || []), selectedEvent.id]));
        try { localStorage.setItem('joinedEvents', JSON.stringify(next)); } catch (e) { }
        return next;
      });
      alert(`Successfully registered for: ${selectedEvent.title}\n\nWe've sent confirmation to ${joinForm.email}`);
      setShowJoinModal(false);
      setJoinForm({ name: '', email: '', company: '', position: '' });
      fetchEvents();
      try { window.dispatchEvent(new CustomEvent('events:updated')); } catch (e) { }
    } catch (error) {
      alert(`Failed to register: ${error.message}`);
    }
  };

  const handleCreateEvent = () => {
    setShowCreateEventModal(true);
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    if (focusFirstInvalid(createFormRef.current)) return;
    try {
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        event_date: newEvent.event_date,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time,
        location: newEvent.location,
        event_type: newEvent.event_type,
        status: 'Upcoming',
        max_attendees: newEvent.max_attendees
      };

      await createEventAPI(eventData);

      setNewEvent({
        title: '',
        location: '',
        description: '',
        event_date: '',
        start_time: '09:00',
        end_time: '17:00',
        event_type: 'Conference',
        max_attendees: 100
      });
      setShowCreateEventModal(false);
      alert('Event created successfully!');
      fetchEvents();
      try { window.dispatchEvent(new CustomEvent('events:updated')); } catch (e) { }
    } catch (error) {
      alert(`Failed to create event: ${error.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await deleteEventAPI(eventId);
        alert('Event deleted successfully');
        fetchEvents();
        try { window.dispatchEvent(new CustomEvent('events:updated')); } catch (e) { }
      } catch (error) {
        alert(`Failed to delete event: ${error.message}`);
      }
    }
  };

  const handleJoinFormChange = (e) => {
    const { name, value } = e.target;
    setJoinForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isEventJoined = (eventId) => {
    return joinedEvents.includes(eventId);
  };

  // --- 5. RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800">

      {/* Join Event Modal (Added Blur here too for consistency) */}
      {showJoinModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">Join Event</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-slate-200">{selectedEvent.title}</h4>
              <p className="text-sm text-gray-600 dark:text-slate-400">{selectedEvent.date} • {selectedEvent.location}</p>
            </div>

            <form ref={joinFormRef} onInvalidCapture={handleInvalidCapture} onSubmit={handleJoinSubmit}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={joinForm.name}
                    onChange={handleJoinFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-darkbg-page dark:text-slate-200"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={joinForm.email}
                    onChange={handleJoinFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-darkbg-page dark:text-slate-200"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={joinForm.company}
                    onChange={handleJoinFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-darkbg-page dark:text-slate-200"
                    placeholder="Enter your company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Position</label>
                  <input
                    type="text"
                    name="position"
                    value={joinForm.position}
                    onChange={handleJoinFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-darkbg-page dark:text-slate-200"
                    placeholder="Enter your position"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-700 dark:bg-darkbg-page dark:text-slate-200"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Event Modal - Blurry Background & Dark Theme */}
      {showCreateEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-100">Create New Event</h3>
              <button
                onClick={() => setShowCreateEventModal(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form ref={createFormRef} onInvalidCapture={handleInvalidCapture} onSubmit={handleSubmitEvent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Event Title</label>
                  <input
                    type="text"
                    name="title"
                    value={newEvent.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-800 text-slate-100 placeholder-slate-500"
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={newEvent.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-800 text-slate-100 placeholder-slate-500"
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-800 text-slate-100 placeholder-slate-500"
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Event Date</label>
                  <input
                    type="date"
                    name="event_date"
                    value={newEvent.event_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-800 text-slate-100 [color-scheme:dark]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Start Time</label>
                    <input
                      type="time"
                      name="start_time"
                      value={newEvent.start_time}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-800 text-slate-100 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">End Time</label>
                    <input
                      type="time"
                      name="end_time"
                      value={newEvent.end_time}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-800 text-slate-100 [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
                  <select
                    name="event_type"
                    value={newEvent.event_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-800 text-slate-100"
                  >
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Symposium">Symposium</option>
                    <option value="Expo">Expo</option>
                    <option value="Forum">Forum</option>
                    <option value="Team Building">Team Building</option>
                    <option value="Training">Training</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Max Attendees</label>
                  <input
                    type="number"
                    name="max_attendees"
                    value={newEvent.max_attendees}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-800 text-slate-100"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="px-6 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Main Content */}
        <div className="flex flex-col flex-1 w-full">
          <main className="flex-1">
            <div className="py-4">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Events</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Discover professional HR events and conferences</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={handleCreateEvent}
                      className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center shadow-md"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Create Event
                    </button>
                  )}
                </div>

                {/* Tab Navigation (with counts) */}
                <div className="mb-6 border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {(() => {
                      const counts = {
                        all: professionalEvents.length,
                        upcoming: professionalEvents.filter(e => getEventCategory(e.event_date) === 'upcoming').length,
                        past: professionalEvents.filter(e => getEventCategory(e.event_date) === 'past').length,
                      };

                      return ['all', 'upcoming', 'past'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-400'
                            }`}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                          <span className="ml-2 bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full text-xs dark:bg-gray-700 dark:text-gray-300">
                            {counts[tab]}
                          </span>
                        </button>
                      ));
                    })()}
                  </nav>
                </div>

                {/* Events Grid */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-slate-200">Loading events...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 dark:bg-red-600">
                      <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-slate-200">Error Loading Events</h3>
                    <p className="text-sm text-gray-500 mb-4 dark:text-slate-200">{error}</p>
                    <button
                      onClick={fetchEvents}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-darkbg-card dark:text-slate-200"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEvents.map((event) => (
                      <div key={event.id} className="bg-white dark:bg-slate-900 overflow-hidden border border-gray-200 dark:border-slate-600 rounded-xl hover:shadow-lg transition-all duration-300 group">
                        <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
                          <div className="absolute inset-0 bg-black opacity-20"></div>
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-90 text-blue-800 dark:bg-slate-600 dark:text-slate-200">
                              {event.event_type || 'Event'}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black bg-opacity-70 text-white">
                              {event.attendee_count || 0} attending
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="flex items-center space-x-1 mb-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-gray-500">
                              {new Date(event.event_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-2 line-clamp-1">{event.title}</h3>

                          <div className="flex items-center text-sm text-gray-500 dark:text-slate-200 mb-3">
                            <svg className="shrink-0 mr-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="line-clamp-1">{event.location || 'TBA'}</span>
                          </div>

                          <p className="text-sm text-gray-600 dark:text-slate-200 leading-relaxed mb-4 line-clamp-2">{event.description}</p>

                          <div className="flex gap-2">
                            <button
                              onClick={() => isEventJoined(event.id) ? null : handleJoinClick(event)}
                              disabled={isEventJoined(event.id)}
                              className={`flex-1 inline-flex items-center justify-center px-4 py-2.5 border text-sm font-medium rounded-lg transition-all duration-200 ${isEventJoined(event.id)
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-600 dark:text-green-200 dark:border-green-600 cursor-not-allowed'
                                : 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:bg-blue-600 dark:text-blue-200 dark:border-blue-600'
                                }`}
                            >
                              {isEventJoined(event.id) ? (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Registered
                                </>
                              ) : (
                                'Register Now'
                              )}
                            </button>

                            {(isAdmin || (currentUser && event.created_by === currentUser.id)) && (
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                                title="Delete Event"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Empty State */}
              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-slate-200 mb-2">No events found</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-200 mb-4">There are no {activeTab} events at the moment.</p>
                  {isAdmin && (
                    <button
                      onClick={handleCreateEvent}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-600 dark:text-blue-200 dark:border-blue-600"
                    >
                      Create First Event
                    </button>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalEventsPage;
