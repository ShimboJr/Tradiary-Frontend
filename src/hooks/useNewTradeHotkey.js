/**
 * hooks/useNewTradeHotkey.js
 * Global "N" key opens the New Trade modal from any page in the authenticated app.
 * Skips if focus is on a text input, textarea, or contenteditable element.
 */
import { useEffect } from 'react';

/**
 * @param {() => void} onOpen  - Callback to open the New Trade modal
 */
export function useNewTradeHotkey(onOpen) {
  useEffect(() => {
    const handler = (e) => {
      // Ignore if modifier keys are held
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== 'n' && e.key !== 'N') return;

      // Ignore when typing inside a text field, textarea, or contenteditable
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isEditable = document.activeElement?.isContentEditable;
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || isEditable) return;

      e.preventDefault();
      onOpen();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
}
