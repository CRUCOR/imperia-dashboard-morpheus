import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FileText, Settings, Play } from 'lucide-react'
import { clsx } from 'clsx'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FileText },
    { name: 'Jobs', href: '/jobs', icon: Play },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-jupyter-orange rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-gray-900">
                    Imperia Dashboard
                  </span>
                </div>
              </div>
              <div className="ml-6 flex space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={clsx(
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                        location.pathname === item.href
                          ? 'border-jupyter-orange text-jupyter-orange'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-6">{children}</main>
    </div>
  )
}