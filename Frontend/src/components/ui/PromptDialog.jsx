import { useState, useCallback, useRef } from 'react';

export function PromptDialog({ state, onClose }) {
  const [value, setValue] = useState('');
  if (!state.open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        {state.title && <h3 className="text-lg font-semibold text-gray-900 mb-2">{state.title}</h3>}
        <p className="text-gray-600 mb-3">{state.message}</p>
        <input
          autoFocus
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          defaultValue={state.defaultValue || ''}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onClose(value); if (e.key === 'Escape') onClose(null); }}
        />
        <div className="flex gap-3 justify-end">
          <button onClick={() => onClose(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onClose(value)} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">OK</button>
        </div>
      </div>
    </div>
  );
}

export function usePrompt() {
  const [state, setState] = useState({ open: false, message: '', title: '', defaultValue: '' });
  const resolveRef = useRef(null);

  const prompt = useCallback((message, defaultValue = '', { title = '' } = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, message, title, defaultValue });
    });
  }, []);

  const handleClose = useCallback((value) => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(value);
  }, []);

  return { prompt, dialogProps: { state, onClose: handleClose } };
}
