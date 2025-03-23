import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Logo from "../assets/logo.svg.png";
import { navigation, NAV_LINKS, PUBLIC_ROUTES, PROTECTED_ROUTES } from "../constants";
import { useAuth } from '../context/AuthContext';
import axios from "axios";
import { getAuthorizationHeader } from '../services/auth-service';

interface Notification {
  notification_id: number;
  auction_id: number | null;
  message: string;
  sent_date: string;
  is_read: boolean;
}

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const authHeader = getAuthorizationHeader();
      if (!authHeader) {
        console.log("No access token found");
        return;
      }

      console.log("Fetching notifications with auth header:", authHeader.substring(0, 20) + "...");
      const response = await axios.get("http://localhost:8000/noti/my-notifications", {
        headers: { 
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (response.data && response.data.Notifications) {
        const notifs = response.data.Notifications.sort((a: Notification, b: Notification) =>
          new Date(b.sent_date).getTime() - new Date(a.sent_date).getTime()
        );
        // Limit to 5 most recent notifications
        const limitedNotifs = notifs.slice(0, 5);
        console.log("Sorted notifications:", limitedNotifs);
        setNotifications(limitedNotifs);
        setUnreadCount(notifs.filter((n: Notification) => !n.is_read).length);
      } else {
        console.log("No notifications found in response:", response.data);
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (isAuthenticated && user?.email && !websocket) {
      const connectWebSocket = () => {
        const ws = new WebSocket(`ws://localhost:8000/ws?email=${user.email}`);

        ws.onopen = () => {
          console.log("✅ WebSocket connected");
          setWebsocket(ws);
        };

        ws.onmessage = (event) => {
          try {
            const incoming = JSON.parse(event.data);
            console.log("🔔 Incoming WS message:", incoming);

            if (incoming.message && incoming.sent_date) {
              const enriched = { ...incoming, is_read: false };
              setNotifications((prev) => {
                // Add new notification and limit to 5
                const updated = [enriched, ...prev].slice(0, 5);
                return updated;
              });
              setUnreadCount((prev) => prev + 1);
              // Play notification sound or show toast if needed
            }
          } catch (error) {
            console.error("Error processing WebSocket message:", error);
          }
        };

        ws.onclose = () => {
          console.log("🔌 WebSocket disconnected");
          setWebsocket(null);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
        };

        return ws;
      };

      const ws = connectWebSocket();

      // Cleanup function
      return () => {
        if (ws) {
          ws.close();
        }
      };
    }
  }, [isAuthenticated, user?.email]);

  // Fetch notifications periodically as a fallback
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(fetchNotifications, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleBellClick = async () => {
    setShowNotifications(!showNotifications);
    if (unreadCount > 0) {
      setUnreadCount(0);
      try {
        const authHeader = getAuthorizationHeader();
        if (!authHeader) {
          console.log("No access token found");
          return;
        }
        await axios.put("http://localhost:8000/noti/mark-read", {}, {
          headers: { 
            Authorization: authHeader,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
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
    <div className="fixed z-50 w-full">
      <div className="flex items-center px-5 lg:px-7.5 xl:px-10 max-lg:px-4 h-18 shadow-lg bg-white">
        <Link to="/" className="block w-[12rem]">
          <img src={Logo} alt="Pokemonlogo" width={150} height={100} />
        </Link>

        {/* Main Navigation */}
        <nav className="flex-1 flex items-center justify-center space-x-24 bg-white h-full">
          {/* Main Links */}
          {NAV_LINKS.MAIN.map((item) => (
            <Link key={item.path} to={item.path} className="py-2 font-bold transition-colors hover:text-[#0908ba]">
              {item.label}
            </Link>
          ))}

          {/* Card Dropdown */}
          <div className="relative inline-block text-left group">
            <button 
              className="py-2 text-black font-bold transition-colors hover:text-[#0908ba]" 
              style={{ fontFamily: "Roboto" }}>
              Card
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 w-40 rounded-md shadow-lg bg-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 mt-5">
              <div className="py-2" role="menu">
                <Link to={PROTECTED_ROUTES.CARD_ENTRY} className="block px-4 py-2 text-gray-700">
                  <span className="text-black font-bold transition-colors hover:text-[#0908ba]">Upload Card</span>
                </Link>
                <Link to={PROTECTED_ROUTES.UNVALIDATED_CARDS} className="block px-4 py-2 text-gray-700">
                  <span className="text-black font-bold transition-colors hover:text-[#0908ba]">Verify Card</span>
                </Link>
                <Link to={PROTECTED_ROUTES.MY_CARDS} className="block px-4 py-2 text-gray-700">
                  <span className="text-black font-bold transition-colors hover:text-[#0908ba]">My Cards</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Auction Dropdown */}
          <div className="relative inline-block text-left group">
            <button className="py-2 text-black font-bold transition-colors hover:text-[#0908ba]" 
              style={{fontFamily: "Roboto" }}>
              Auction
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 w-40 rounded-md shadow-lg bg-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 mt-5">
              <div className="py-1" role="menu">
                <Link to={PROTECTED_ROUTES.CREATE_AUCTION} className="block px-4 py-2">
                  <span className="text-black font-bold transition-colors hover:text-[#0908ba]">Create Auction</span>
                </Link>
                <Link to={PROTECTED_ROUTES.MY_AUCTIONS} className="block px-4 py-2">
                  <span className="text-black font-bold transition-colors hover:text-[#0908ba]">My Auctions</span>
                </Link>
                <Link to={PROTECTED_ROUTES.WINNING_AUCTIONS} className="block px-4 py-2">
                  <span className="text-black font-bold transition-colors hover:text-[#0908ba]">Winning Bids</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center space-x-12">
          {/* Auth/Account Section */}
          {isAuthenticated ? (
            <>
              {/* Account Dropdown */}
              <div className="relative inline-block text-left group">
                <button className="py-2 text-black font-bold transition-colors hover:text-[#0908ba]">
                  Account
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 w-48 rounded-md shadow-lg bg-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 mt-5">
                  <div className="py-1" role="menu">
                    <div className="block px-4 py-2 text-sm text-gray-500 border-b truncate">{user?.email}</div>
                    <Link to={PROTECTED_ROUTES.PROFILE} className="block px-4 py-2">
                      <span className="text-black font-bold w-full text-left transition-colors hover:text-[#0908ba]">
                        Profile
                      </span>
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-black font-bold hover:text-[#0908ba]">
                      Logout
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={handleBellClick}
                  className="w-12 py-2 text-gray-500 font-bold transition-colors hover:text-[#0908ba] focus:outline-none"
                  style={{ borderRadius: "100px" }}
                >
                  <svg 
                    className="w-4 h-4 mx-auto" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50">
                    <div className="p-4 border-b">
                      <h3 className="text-lg font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.notification_id}
                            className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                              !notification.is_read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <p className="text-sm text-gray-800">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.sent_date).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Auth Links
            <>
              {NAV_LINKS.AUTH.map((item) => (
                <Link key={item.path} to={item.path}>
                  <span className="py-2 text-gray-500 font-bold transition-colors hover:text-[#0908ba]" style={{ fontFamily: "Roboto" }}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </>
          )}

          {/* Search Button */}
          <Link to={PUBLIC_ROUTES.SEARCH}>
            <button className="w-12 py-2 text-gray-500 font-bold transition-colors hover:text-[#0908ba]" 
              style={{ borderRadius: "100px" }}>
              {"\u2315"}
            </button>
          </Link>
        </div>  
      </div>
    </div>
  );
};

export default Header;
