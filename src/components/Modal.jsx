import { useEffect } from 'react';
import { X } from 'lucide-react';

// Generic dialog: closes on Escape or a click on the backdrop, and stops the
// page behind it from scrolling.
export default function Modal({ title, onClose, children, footer, size = 'md', layer = 1 }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 100 + layer * 10 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        {title ? (
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        ) : (
          <button className="icon-btn modal-close-float" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
