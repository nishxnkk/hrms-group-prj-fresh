import { useEffect, useState } from "react";

export default function GuardedModal({
  children,
  onDiscard,
  onSave,
  className = "",
  contentClassName = "",
  confirmMessage = "Do you want to save these changes?",
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) setShowConfirm(true);
  };

  const handleDiscard = () => {
    setShowConfirm(false);
    onDiscard?.();
  };

  const handleContinue = () => {
    setShowConfirm(false);
    onSave?.();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md ${className}`}
      onMouseDown={handleBackdropClick}
    >
      <div className={contentClassName} onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Unsaved Changes
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {confirmMessage}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
