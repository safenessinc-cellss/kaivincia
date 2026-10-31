import React from 'react';

interface SoftphoneKeypadProps {
  onDigitPress: (char: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

const KEYPAD_BUTTONS = [
  { key: '1', sub: '—' },
  { key: '2', sub: 'ABC' },
  { key: '3', sub: 'DEF' },
  { key: '4', sub: 'GHI' },
  { key: '5', sub: 'JKL' },
  { key: '6', sub: 'MNO' },
  { key: '7', sub: 'PQRS' },
  { key: '8', sub: 'TUV' },
  { key: '9', sub: 'WXYZ' },
  { key: '*', sub: 'SEC' },
  { key: '0', sub: '+' },
  { key: '#', sub: 'HASH' },
];

export default function SoftphoneKeypad({
  onDigitPress,
  disabled = false,
  compact = false
}: SoftphoneKeypadProps) {
  return (
    <div className={`grid grid-cols-3 ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {KEYPAD_BUTTONS.map((btn) => (
        <button
          key={btn.key}
          type="button"
          disabled={disabled}
          onClick={() => onDigitPress(btn.key)}
          className={`ios-keypad group bg-slate-100 hover:bg-blue-50 active:bg-blue-100 border border-slate-200 hover:border-blue-300 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none select-none ${
            compact ? 'py-1.5 px-1' : 'py-2 px-1.5'
          }`}
        >
          <span className="text-base sm:text-lg font-mono font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
            {btn.key}
          </span>
          <span className="text-[8px] font-mono text-slate-500 group-hover:text-blue-600 tracking-wider uppercase leading-none mt-0.5">
            {btn.sub}
          </span>
        </button>
      ))}
    </div>
  );
}
