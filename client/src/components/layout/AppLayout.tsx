import { Outlet, Link, useLocation } from "react-router-dom";
import { Bus, LogOut, Navigation, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const CSS = `
  .al-root { display: flex; flex-direction: column; min-height: 100vh; background: #f5f7fa; }
  .al-header {
    height: 56px; display: flex; align-items: center; padding: 0 16px; gap: 12px;
    background: #fff; border-bottom: 1px solid #e8edf2;
    box-shadow: 0 1px 8px rgba(0,0,0,0.06); z-index: 50; flex-shrink: 0;
    position: sticky; top: 0;
  }
  .al-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
  .al-logo-icon {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 14px rgba(99,102,241,0.3); flex-shrink: 0;
  }
  .al-logo-name { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; }
  .al-logo-sub { font-size: 9.5px; font-weight: 700; color: #6366f1; letter-spacing: 0.12em; text-transform: uppercase; }
  .al-spacer { flex: 1; }
  .al-user-info { display: none; text-align: right; margin-right: 4px; }
  .al-user-name { font-size: 13px; font-weight: 600; color: #0f172a; }
  .al-user-role { font-size: 11px; color: #94a3b8; }
  .al-avatar {
    width: 32px; height: 32px; border-radius: 99px; flex-shrink: 0;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #fff;
  }
  .al-logout-btn {
    display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600;
    padding: 7px 13px; border-radius: 10px; cursor: pointer;
    color: #ef4444; background: #fff5f5; border: 1px solid #fecaca;
    transition: background 0.15s;
  }
  .al-logout-btn:hover { background: #fee2e2; }
  .al-main { flex: 1; overflow-y: auto; padding-bottom: 64px; }
  .al-bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    background: #fff; border-top: 1px solid #e8edf2;
    display: flex; height: 60px;
    box-shadow: 0 -2px 16px rgba(0,0,0,0.06);
  }
  .al-nav-item {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; text-decoration: none; font-size: 11px; font-weight: 600;
    color: #94a3b8; transition: color 0.15s; position: relative;
  }
  .al-nav-item-active { color: #6366f1; }
  .al-nav-bar {
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 28px; height: 3px; background: #6366f1; border-radius: 0 0 6px 6px;
  }
  .al-nav-icon {
    width: 34px; height: 28px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
  }
  .al-nav-icon-active { background: #eef2ff; }
  @media (min-width: 768px) {
    .al-header { height: 64px; padding: 0 36px; }
    .al-user-info { display: block; }
    .al-main { padding-bottom: 0; }
    .al-bottom-nav { display: none; }
  }
`;

export default function AppLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: "/driver", icon: LayoutDashboard, label: "Dashboard", exact: true },
    {
      to: "/driver/trip",
      icon: Navigation,
      label: "Active Trip",
      exact: false,
    },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="al-root">
        <header className="al-header">
          <Link to="/driver" className="al-logo">
            <div className="al-logo-icon">
              <Bus size={17} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="al-logo-name">Safara</div>
              <div className="al-logo-sub">Driver</div>
            </div>
          </Link>

          <div className="al-spacer" />

          <div className="al-user-info">
            <div className="al-user-name">{user?.name}</div>
            <div className="al-user-role">Driver</div>
          </div>
          <div className="al-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <button className="al-logout-btn" onClick={logout}>
            <LogOut size={13} />
            <span style={{ display: "none" }} className="sm-inline">
              Sign out
            </span>
          </button>
        </header>

        <main className="al-main">
          <Outlet />
        </main>

        <nav className="al-bottom-nav">
          {navItems.map(({ to, icon: Icon, label, exact }) => {
            const active = exact
              ? location.pathname === to
              : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`al-nav-item${active ? " al-nav-item-active" : ""}`}
              >
                {active && <span className="al-nav-bar" />}
                <div
                  className={`al-nav-icon${active ? " al-nav-icon-active" : ""}`}
                >
                  <Icon size={17} />
                </div>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
