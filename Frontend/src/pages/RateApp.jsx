import React, { useState } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RateApp = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState(null);

  const submit = () => {
    if (rating === 0) {
      setStatus({ type: 'error', text: 'Please choose a rating.' });
      return;
    }
    setStatus({ type: 'success', text: 'Thanks for rating the app!' });
    setTimeout(() => setStatus(null), 2500);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-slate-800 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6 mt-5">
          <button onClick={() => navigate(-1)} className="p-2 mr-4 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-100">
            <ArrowLeft />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Rate App</h1>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-6 transition-colors duration-300">
          <p className="text-gray-700 dark:text-slate-300 mb-4">If you enjoy the app, please leave a rating — it helps us a lot!</p>

          <div className="flex items-center gap-2 mb-4">
            {[1,2,3,4,5].map((i) => (
              <button 
                key={i} 
                type="button" 
                onClick={() => setRating(i)} 
                className={`p-2 rounded-md ${
                  rating >= i 
                    ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                    : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <Star className={`${rating >= i ? 'text-yellow-500' : 'text-gray-400 dark:text-slate-600'}`} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={submit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">Submit</button>
            <a href="#" onClick={(e)=>{e.preventDefault(); setStatus({type:'info', text:'Open store link placeholder'})}} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Open in Store</a>
            {status && <div className={`text-sm ${status.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{status.text}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateApp;
