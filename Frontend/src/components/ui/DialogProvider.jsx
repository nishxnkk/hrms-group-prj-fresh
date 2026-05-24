import { useEffect, useState } from "react";

let openDialog = null;

const fallbackResolve = (type) => {
  if (type === "confirm") return false;
  if (type === "prompt") return "";
  return undefined;
};

export function uiAlert(message, options = {}) {
  if (!openDialog) return Promise.resolve(fallbackResolve("alert"));
  return openDialog({ type: "alert", message, ...options });
}

export function uiConfirm(message, options = {}) {
  if (!openDialog) return Promise.resolve(fallbackResolve("confirm"));
  return openDialog({ type: "confirm", message, ...options });
}

export function uiPrompt(message, defaultValue = "", options = {}) {
  if (!openDialog) return Promise.resolve(fallbackResolve("prompt"));
  return openDialog({ type: "prompt", message, defaultValue, ...options });
}

export default function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    openDialog = (nextDialog) =>
      new Promise((resolve) => {
        setInputValue(nextDialog.defaultValue || "");
        setDialog({ ...nextDialog, resolve });
      });

    const originalAlert = window.alert;
    window.uiAlert = uiAlert;
    window.uiConfirm = uiConfirm;
    window.uiPrompt = uiPrompt;
    window.alert = (message) => {
      uiAlert(String(message));
    };

    return () => {
      openDialog = null;
      window.alert = originalAlert;
      delete window.uiAlert;
      delete window.uiConfirm;
      delete window.uiPrompt;
    };
  }, []);

  const closeDialog = (value) => {
    if (dialog?.resolve) dialog.resolve(value);
    setDialog(null);
  };

  useEffect(() => {
    if (!dialog) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [dialog]);

  const title =
    dialog?.title ||
    (dialog?.type === "confirm" ? "Please Confirm" : dialog?.type === "prompt" ? "Input Required" : "Notice");

  return (
    <>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
              {String(dialog.message || "")}
            </p>

            {dialog.type === "prompt" && (
              <input
                autoFocus
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            )}

            <div className="mt-5 flex justify-end gap-2">
              {dialog.type !== "alert" && (
                <button
                  type="button"
                  onClick={() => closeDialog(dialog.type === "confirm" ? false : null)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => closeDialog(dialog.type === "confirm" ? true : dialog.type === "prompt" ? inputValue : undefined)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {dialog.type === "confirm" ? "Confirm" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
