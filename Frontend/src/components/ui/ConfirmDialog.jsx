import { useCallback, useEffect, useState } from 'react';

let resolveRef = null;

export function ConfirmDialog({ state, onClose }) {
  useEffect(() => {
    if (!state.open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [state.open]);

  if (!state.open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        {state.title && <h3 className="text-lg font-semibold text-gray-900 mb-2">{state.title}</h3>}
        <p className="text-gray-600 mb-6">{state.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onClose(true)}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            {state.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState({ open: false, message: '', title: '', confirmText: '' });

  const confirm = useCallback((message, { title = '', confirmText = 'Confirm' } = {}) => {
    return new Promise((resolve) => {
      resolveRef = resolve;
      setState({ open: true, message, title, confirmText });
    });
  }, []);

  const handleClose = useCallback((result) => {
    setState((s) => ({ ...s, open: false }));
    resolveRef?.(result);
  }, []);

  return { confirm, dialogProps: { state, onClose: handleClose } };
}
