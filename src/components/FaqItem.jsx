// frontend/src/components/FaqItem.jsx
import React, { useState } from 'react';

function FaqItem({ question, answer, categoria }) { 
  const [isOpen, setIsOpen] = useState(false); 
  
  return ( 
    <div className="bg-surface-1 dark:bg-surface-1 rounded-card border border-line/80 dark:border-line shadow-xs hover:shadow-md overflow-hidden motion duration-[var(--dur-base)] mb-3"> 
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left px-6 py-4 flex justify-between items-center text-content-1 dark:text-white focus:outline-none hover:bg-surface-2/80 dark:hover:bg-darkbg-hover transition-colors cursor-pointer"> 
        <span className="flex items-center gap-3 text-xs sm:text-sm font-bold text-content-1 dark:text-zinc-200">
          {categoria && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-soft dark:bg-brand/10 text-brand-text dark:text-brand text-[10px] font-black uppercase tracking-wider">
              {categoria.charAt(0)}
            </span>
          )}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-3 dark:bg-surface-1/10 text-content-3 dark:text-content-3 text-xs">
            <i className="fa-solid fa-question"></i>
          </span>
          {question}
        </span> 
        <i className={`fa-solid fa-chevron-down text-content-3 transition-transform duration-[var(--dur-base)] text-xs ${isOpen ? 'rotate-180 text-brand-text' : ''}`}></i> 
      </button> 
      <div className={`motion duration-[var(--dur-base)] ease-in-out ${isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}> 
        <div className="px-6 pb-5 pt-0 text-xs sm:text-sm text-content-2 dark:text-content-3 leading-relaxed border-t border-line dark:border-line/60 pt-4 mt-1">{answer}</div>
      </div> 
    </div>
  );
}

export default FaqItem;
