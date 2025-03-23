import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Logo from "../assets/logo.svg.png";
import { navigation, NAV_LINKS, PUBLIC_ROUTES, PROTECTED_ROUTES } from "../constants";
import { useAuth } from '../context/AuthContext';
import axios from "axios";
import { getAuthorizationHeader } from '../services/auth-service';

// Add CSS for animations
const toastAnimations = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-20px); }
}
`;

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
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Toast notification state
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);
  const [showToast, setShowToast] = useState(false);

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
          console.log("WebSocket connected");
          setWebsocket(ws);
        };

        ws.onmessage = (event) => {
          try {
            const incoming = JSON.parse(event.data);
            console.log("Incoming WS message:", incoming);

            if (incoming.message && incoming.sent_date) {
              const enriched = { ...incoming, is_read: false };
              
              // Set as toast notification and show it
              setToastNotification(enriched);
              setShowToast(true);
              
              // Auto-dismiss toast after 5 seconds
              setTimeout(() => {
                setShowToast(false);
              }, 5000);
              
              setNotifications((prev) => {
                // Add new notification and limit to 5
                const updated = [enriched, ...prev].slice(0, 5);
                return updated;
              });
              setUnreadCount((prev) => prev + 1);
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
          console.error(" WebSocket error:", error);
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

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    <div className="fixed z-100 w-full">
      {/* Style tag for animations */}
      <style>{toastAnimations}</style>
      
      {/* Toast Notification */}
      {showToast && toastNotification && (
        <div
          style={{
            position: 'fixed',
            top: '80px', // Position below the header
            right: '20px',
            backgroundColor: '#007bff',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 99,
            maxWidth: '300px',
            animation: 'fadeIn 0.3s, fadeOut 0.3s 4.7s',
          }}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>New Notification</div>
          <div>{toastNotification.message}</div>
          <div style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.8 }}>
            {new Date(toastNotification.sent_date).toLocaleString()}
          </div>
          <button
            onClick={() => setShowToast(false)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '0',
            }}
          >
            ×
          </button>
        </div>
      )}
      
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
              <div style={{ position: 'relative' }} ref={notificationRef}>
                <button
                  onClick={handleBellClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#6B7280'
                  }}
                >
                  <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ width: '1rem', height: '1rem' }}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      backgroundColor: 'red',
                      color: 'white',
                      borderRadius: '50%',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.8rem',
                      minWidth: '1.2rem',
                      textAlign: 'center'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 25px)',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                    width: '300px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 50
                  }}>
                    <div style={{
                      padding: '1rem',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <h3 style={{ margin: 0, fontWeight: 'bold' }}>Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleBellClick}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#007bff',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.notification_id}
                          style={{
                            padding: '1rem',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            backgroundColor: notification.is_read ? 'white' : '#f8f9fa'
                          }}
                        >
                          <div style={{ marginBottom: '0.5rem' }}>{notification.message}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>
                            {new Date(notification.sent_date).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
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
