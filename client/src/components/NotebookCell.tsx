import { ReactNode } from 'react'
import { Play, Square, MoreHorizontal } from 'lucide-react'
import { clsx } from 'clsx'

interface NotebookCellProps {
  type: 'code' | 'markdown' | 'upload'
  children: ReactNode
  isRunning?: boolean
  onRun?: () => void
  className?: string
}

export function NotebookCell({
  type,
  children,
  isRunning = false,
  onRun,
  className,
}: NotebookCellProps) {
  return (
    <div className={clsx('cell', className)}>
      <div className="cell-toolbar">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {type}
          </span>
          {type === 'code' && (
            <span className="text-xs text-gray-400">In [ ]</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {onRun && (
            <button
              onClick={onRun}
              disabled={isRunning}
              className={clsx(
                'p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-200',
                isRunning && 'text-jupyter-orange'
              )}
            >
              {isRunning ? (
                <Square className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          )}
          <button className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-200">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="cell-content">{children}</div>
    </div>
  )
}