import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Logo from "../assets/logo.svg.png";
import { NAV_LINKS, PROTECTED_ROUTES } from "../constants";
import { useAuth } from '../context/AuthContext';
import axios from "axios";

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      const response = await axios.get("http://localhost:8000/noti/my-notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const notifs = (response.data.Notifications || []).sort((a, b) =>
        new Date(b.sent_date || b.time_sent).getTime() - new Date(a.sent_date || a.time_sent).getTime()
      );
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (isAuthenticated && user?.email && !websocket) {
      const ws = new WebSocket(`ws://localhost:8000/ws?email=${user.email}`);

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setWebsocket(ws);
      };

      ws.onmessage = (event) => {
        const incoming = JSON.parse(event.data);
        console.log("🔔 Incoming WS message:", incoming);

        if (incoming.message && incoming.sent_date) {
          const enriched = { ...incoming, is_read: false };
          setNotifications((prev) => [enriched, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      };

      ws.onclose = () => {
        console.log("🔌 WebSocket disconnected");
        setWebsocket(null);
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
      };
    }
  }, [isAuthenticated, user?.email, websocket]);

  const handleBellClick = async () => {
    setShowNotifications(!showNotifications);
    setUnreadCount(0);

    try {
      const token = sessionStorage.getItem("access_token");
      await axios.put("http://localhost:8000/noti/mark-read", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (e) {
      console.error("❌ Failed to mark notifications as read:", e);
    }
  };

  const handleLogout = () => {
    if (websocket) {
      websocket.close();
      setWebsocket(null);
    }
    logout();
    navigate('/');
  };

  return (
    <div className="fixed z-50 w-full bg-white">
      <div className="flex items-center px-5 lg:px-7.5 xl:px-10 max-lg:px-4 h-18 shadow-lg bg-white">
        <Link to="/" className="block w-[12rem]">
          <img src={Logo} alt="Pokemonlogo" width={150} height={100} />
        </Link>

        <nav className="relative z-2 space-x-30 flex items-center justify-center ml-auto bg-white h-full">
          {NAV_LINKS.MAIN.map((item) => (
            <Link key={item.path} to={item.path}>
              <a className="w-40 py-2 font-bold transition-colors hover:text-[#0908ba]">
                {item.label}
              </a>
            </Link>
          ))}

          {/* Card Dropdown */}
          <div className="relative inline-block text-left group">
            <button className="py-2 text-black font-bold transition-colors hover:text-[#0908ba]">
              Card
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 w-40 rounded-md shadow-lg bg-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 mt-5">
              <div className="py-2" role="menu">
                <Link to={PROTECTED_ROUTES.CARD_ENTRY} className="block px-4 py-2 text-gray-700">
                  <button className="text-black font-bold hover:text-[#0908ba]">Upload Card</button>
                </Link>
                <Link to={PROTECTED_ROUTES.UNVALIDATED_CARDS} className="block px-4 py-2 text-gray-700">
                  <button className="text-black font-bold hover:text-[#0908ba]">Verify Card</button>
                </Link>
                <Link to={PROTECTED_ROUTES.MY_CARDS} className="block px-4 py-2 text-gray-700">
                  <button className="text-black font-bold hover:text-[#0908ba]">My Cards</button>
                </Link>
              </div>
            </div>
          </div>

          {/* Auction Dropdown */}
          <div className="relative inline-block text-left group">
            <button className="py-2 text-black font-bold transition-colors hover:text-[#0908ba]">
              Auction
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 w-40 rounded-md shadow-lg bg-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 mt-5">
              <div className="py-1" role="menu">
                <Link to={PROTECTED_ROUTES.CREATE_AUCTION} className="block px-4 py-2">
                  <button className="text-black font-bold hover:text-[#0908ba]">Create Auction</button>
                </Link>
                <Link to={PROTECTED_ROUTES.MY_AUCTIONS} className="block px-4 py-2">
                  <button className="text-black font-bold hover:text-[#0908ba]">My Auctions</button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {/* Notification Bell */}
          <div className="relative">
            <button onClick={handleBellClick} className="relative text-2xl">
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-12 right-0 bg-white border rounded shadow-lg w-72 p-2 max-h-80 overflow-auto z-10">
                {notifications.length > 0 ? (
                  <ul>
                    {notifications.map((notification, index) => (
                      <li
                        key={index}
                        className={`py-2 px-4 text-sm font-medium border-b border-gray-200 ${
                          notification.is_read ? "text-gray-500" : "text-gray-800"
                        }`}
                      >
                        <div>{notification.message}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(notification.sent_date || notification.time_sent).toLocaleString("en-SG", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500 text-center py-2">No notifications</div>
                )}
              </div>
            )}
          </div>

          {/* Account Dropdown */}
          {isAuthenticated ? (
            <div className="relative inline-block text-left group">
              <button className="py-2 text-black font-bold transition-colors hover:text-[#0908ba]">
                Account
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 w-48 rounded-md shadow-lg bg-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 mt-5">
                <div className="py-1" role="menu">
                  <div className="block px-4 py-2 text-sm text-gray-500 border-b truncate">{user?.email}</div>
                  <Link to={PROTECTED_ROUTES.PROFILE} className="block px-4 py-2">
                    <button className="text-black font-bold w-full text-left hover:text-[#0908ba]">Profile</button>
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-black font-bold hover:text-[#0908ba]">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            NAV_LINKS.AUTH.map((item) => (
              <Link key={item.path} to={item.path}>
                <button className="py-2 text-gray-500 font-bold transition-colors hover:text-[#0908ba]">
                  {item.label}
                </button>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
