import React from 'react';
import './styles/modal.css';

export default function ModalFull({open, onClose, title, children, footer}){
  if(!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-full">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}