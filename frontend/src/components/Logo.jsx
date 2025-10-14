/* src/components/Logo.jsx */
import { SparklesIcon } from "@heroicons/react/24/solid"

export default function Logo({ size = "default", showText = true, className = "" }) {
  const sizes = {
    small: {
      icon: "w-6 h-6",
      text: "text-lg",
      blur: "blur-lg"
    },
    default: {
      icon: "w-8 h-8",
      text: "text-2xl",
      blur: "blur-xl"
    },
    large: {
      icon: "w-20 h-20 md:w-24 md:h-24",
      text: "text-4xl md:text-5xl",
      blur: "blur-2xl"
    }
  }

  const currentSize = sizes[size] || sizes.default

  return (
    <div className={`flex items-center gap-2 group cursor-pointer ${className}`}>
      <div className="relative">
        <SparklesIcon 
          className={`${currentSize.icon} text-cyan-400 group-hover:rotate-180 transition-transform duration-700 ${size === 'large' ? 'drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]' : ''}`} 
        />
        <div className={`absolute inset-0 ${currentSize.blur} bg-cyan-400/30 group-hover:bg-cyan-400/50 transition-all ${size === 'large' ? 'animate-pulse' : ''}`} />
      </div>
      {showText && (
        <h1 className={`${currentSize.text} font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]`}>
          ProManage+
        </h1>
      )}
    </div>
  )
}
