/* src/components/Logo.jsx - FINAL FIXED VERSION WITHOUT LINK */
import { BoltIcon } from '@heroicons/react/24/solid';

export default function Logo({ size = 'default', showText = true, className = '' }) {
  const sizes = {
    small: {
      circle: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-base ml-2',
    },
    default: {
      circle: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-lg ml-2.5',
    },
    large: {
      circle: 'w-14 h-14',
      icon: 'w-7 h-7',
      text: 'text-2xl ml-3',
    }
  };

  const s = sizes[size];

  // ✅ NO LINK HERE - Just return div
  return (
    <div className={`inline-flex items-center group ${className}`}>
      <div className={`${s.circle} rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300 group-hover:scale-110`}>
        <BoltIcon className={`${s.icon} text-white`} />
      </div>
      {showText && (
        <span className={`${s.text} font-bold`}>
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            ProManage
          </span>
          <span className="text-cyan-400">+</span>
        </span>
      )}
    </div>
  );
}
