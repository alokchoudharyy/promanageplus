import { useState } from 'react';
import { 
  ArrowDownTrayIcon, 
  DocumentArrowDownIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';

export default function ExportButton({ 
  onExport, 
  loading = false, 
  disabled = false,
  formats = ['excel', 'pdf', 'csv'],
  label = 'Export',
  size = 'md' 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    setShowMenu(false);
    
    try {
      await onExport(format);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const formatLabels = {
    excel: { label: 'Excel (.xlsx)', icon: '📊' },
    pdf: { label: 'PDF Document', icon: '📄' },
    csv: { label: 'CSV (.csv)', icon: '📝' },
  };

  return (
    <div className="relative inline-block">
      {/* Single Format Button */}
      {formats.length === 1 ? (
        <button
          onClick={() => handleExport(formats[0])}
          disabled={disabled || loading || exporting}
          className={`
            ${sizeClasses[size]}
            inline-flex items-center gap-2 
            bg-gradient-to-r from-green-500 to-emerald-600 
            text-white font-medium rounded-md 
            hover:opacity-90 
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all shadow-md hover:shadow-lg
          `}
        >
          {exporting || loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Exporting...
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="h-5 w-5" />
              {label}
            </>
          )}
        </button>
      ) : (
        /* Multiple Format Dropdown */
        <>
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={disabled || loading || exporting}
            className={`
              ${sizeClasses[size]}
              inline-flex items-center gap-2 
              bg-gradient-to-r from-green-500 to-emerald-600 
              text-white font-medium rounded-md 
              hover:opacity-90 
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all shadow-md hover:shadow-lg
            `}
          >
            {exporting || loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Exporting...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-5 w-5" />
                {label}
                <ChevronDownIcon className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Dropdown Menu */}
          {showMenu && !exporting && !loading && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  Select Format
                </div>
                {formats.map((format) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3"
                  >
                    <span className="text-2xl">{formatLabels[format].icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatLabels[format].label}
                      </p>
                      <p className="text-xs text-gray-500">
                        Download as {format.toUpperCase()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Click Outside Handler */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
