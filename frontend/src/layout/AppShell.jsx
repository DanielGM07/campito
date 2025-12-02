// File: src/layout/AppShell.jsx
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell({ children }) {
  return (
    <div className="app-root">
      <Topbar />
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">
          <div className="app-main-inner">{children}</div>
        </main>
      </div>
    </div>
  )
}
