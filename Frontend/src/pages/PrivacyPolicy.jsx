import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-slate-800 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6 mt-5">
          <button onClick={() => navigate(-1)} className="p-2 mr-4 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-100">
            <ArrowLeft />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Privacy Policy</h1>
        </div>

        <div className="flex flex-col h-full w-full max-w-6xl mx-auto">
          
          {/* Outer Card Container */}
          <div className="bg-white/40 dark:bg-slate-900/60 backdrop-blur-sm border-2 border-white dark:border-slate-700 rounded-[2rem] p-6 md:p-10 h-full relative flex flex-col shadow-sm overflow-hidden transition-colors duration-300">
            
            {/* Header Title */}
            <div className="flex-shrink-0 mb-6 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-[#071A52] dark:text-slate-100 font-poppins">
                Privacy Policy
              </h1>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5 pb-16 md:pb-9 ">
              
              {/* Block 1 */}
              <div className="bg-[#EBEBF0]/80 dark:bg-slate-800/80 p-5 rounded-xl transition-colors duration-300">
                <h3 className="font-bold text-[#7B2CBF] dark:text-purple-400 mb-2 text-sm md:text-base font-poppins">
                  last updated: October 26, 2025
                </h3>
                <p className="text-[#4A4A4A] dark:text-slate-300 text-xs md:text-sm font-medium leading-relaxed font-poppins">
                  Your privacy is important to us. This Privacy Policy explains what information we collect, 
                  how we use it, and your choices regarding your information.
                </p>
              </div>

              {/* Block 2 */}
              <div className="bg-[#EBEBF0]/80 dark:bg-slate-800/80 p-5 rounded-xl transition-colors duration-300">
                <h3 className="font-bold text-[#7B2CBF] dark:text-purple-400 mb-2 text-sm md:text-base font-poppins">
                  Information We Collect
                </h3>
                <ul className="text-[#4A4A4A] dark:text-slate-300 text-xs md:text-sm font-medium space-y-1 list-none font-poppins">
                  <li>• Personal Information (e.g., name, email address)</li>
                  <li>• Usage Data (e.g., IP address, browser type)</li>
                  <li>• Cookies and Tracking Technologies</li>
                </ul>
              </div>

              {/* Block 3 */}
              <div className="bg-[#EBEBF0]/80 dark:bg-slate-800/80 p-5 rounded-xl transition-colors duration-300">
                <h3 className="font-bold text-[#7B2CBF] dark:text-purple-400 mb-2 text-sm md:text-base font-poppins">
                  How We Use Your Information
                </h3>
                <ul className="text-[#4A4A4A] dark:text-slate-300 text-xs md:text-sm font-medium space-y-1 list-none font-poppins">
                  <li>• To provide and maintain our service.</li>
                  <li>• To improve, personalize, and expand our service.</li>
                  <li>• For communication and customer support.</li>
                </ul>
              </div>

              {/* Block 4 */}
              <div className="bg-[#EBEBF0]/80 dark:bg-slate-800/80 p-5 rounded-xl transition-colors duration-300">
                <h3 className="font-bold text-[#7B2CBF] dark:text-purple-400 mb-2 text-sm md:text-base font-poppins">
                  Data Retention
                </h3>
                <p className="text-[#4A4A4A] dark:text-slate-300 text-xs md:text-sm font-medium leading-relaxed font-poppins">
                  We store your personal data only as long as necessary to provide our services or comply with legal obligations.
                </p>
              </div>

            </div>

            {/* Footer Button */}
            <div className="absolute bottom-4 left-0 right-0 md:left-auto md:right-10 flex justify-center md:block pointer-events-none">
              <button 
                className="pointer-events-auto bg-[#3B9DF8] hover:bg-blue-600 text-white text-sm font-semibold py-3 px-10 rounded-full shadow-lg transition-colors duration-300 font-poppins"
                onClick={() => console.log("Accepted")}
              >
                Accept and Continue
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
