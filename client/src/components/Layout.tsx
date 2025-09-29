import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Database, FileText, Folder, Play, Settings, Layers } from 'lucide-react'
import { clsx } from 'clsx'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const navigation = [
    { name: 'Panel Principal', href: '/', icon: BarChart3 },
    { name: 'Análisis', href: '/jobs', icon: Play },
  ]

  const sidebarItems = [
    { name: 'Archivos', icon: Folder, href: '#' },
    { name: 'Datasets', icon: Database, href: '#' },
    { name: 'Modelos', icon: Layers, href: '#' },
    { name: 'Resultados', icon: FileText, href: '#' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar - Jupyter-like */}
      <div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">Imperia</h1>
              <p className="text-xs text-neutral-500">Dashboard Morpheus</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 border-b border-neutral-200">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    location.pathname === item.href
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  )}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Items */}
        <div className="flex-1 p-4">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Explorador
          </h3>
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.name}
                </a>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200">
          <div className="text-xs text-neutral-500">
            <p>Nvidia Morpheus</p>
            <p>Versión 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                {navigation.find(item => item.href === location.pathname)?.name || 'Panel Principal'}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Análisis de datos con inteligencia artificial
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-xs text-neutral-500">
                Estado: <span className="text-green-600 font-medium">Conectado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}