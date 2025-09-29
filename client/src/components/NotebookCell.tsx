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

const getCellTypeLabel = (type: string) => {
  switch (type) {
    case 'code':
      return 'Código'
    case 'markdown':
      return 'Markdown'
    case 'upload':
      return 'Carga'
    default:
      return type
  }
}

export function NotebookCell({
  type,
  children,
  isRunning = false,
  onRun,
  className,
}: NotebookCellProps) {
  return (
    <div className={clsx('notebook-cell', className)}>
      <div className="notebook-cell-header">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-neutral-500 uppercase tracking-wide font-medium">
            {getCellTypeLabel(type)}
          </span>
          {type === 'code' && (
            <span className="text-xs text-neutral-400">In [ ]</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {onRun && (
            <button
              onClick={onRun}
              disabled={isRunning}
              className={clsx(
                'p-1 rounded text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 transition-colors',
                isRunning && 'text-orange-500'
              )}
              title={isRunning ? 'Detener ejecución' : 'Ejecutar celda'}
            >
              {isRunning ? (
                <Square className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            className="p-1 rounded text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
            title="Más opciones"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="notebook-cell-content">{children}</div>
    </div>
  )
}