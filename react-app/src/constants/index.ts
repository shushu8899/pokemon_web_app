// Navigation Types
interface NavigationItem {
  id: number;
  title: string;
  path: string;
}

interface NavLink {
  path: string;
  label: string;
}

interface NavLinks {
  MAIN: NavLink[];
  AUTH: NavLink[];
  USER: NavLink[];
  ADMIN: NavLink[];
}

interface Routes {
  HOME: string;
  SEARCH: string;
  LOGIN_REGISTER: string;
  FORGOT_PASSWORD: string;
  RESET_PASSWORD: string;
  BIDDING: string;
}

interface ProtectedRoutes {
  CARD_ENTRY: string;
  UNVALIDATED_CARDS: string;
  MY_CARDS: string;
  EDIT_CARD: string;
  MY_AUCTIONS: string;
  CREATE_AUCTION: string;
  AUCTION_DETAILS: string;
  PROFILE: string;
  WINNING_AUCTIONS: string;
}

// Navigation Items
export const navigation: NavigationItem[] = [
  {
    id: 1,
    title: "Main",
    path: "/",
  },
  {
    id: 2,
    title: "Card",
    path: "/card",
  },
  {
    id: 3,
    title: "Auction",
    path: "/auction",
  },
  {
    id: 4,
    title: "Login/Sign Up",
    path: "/login",
  },
];

// Public Routes
export const PUBLIC_ROUTES: Routes = {
  HOME: '/',
  SEARCH: '/search',
  LOGIN_REGISTER: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  BIDDING: '/bidding/:auctionID',
};

// Protected Routes
export const PROTECTED_ROUTES: ProtectedRoutes = {
  CARD_ENTRY: '/card-entry',
  UNVALIDATED_CARDS: '/unvalidated-cards',
  MY_CARDS: '/my-cards',
  EDIT_CARD: '/entry/card-entry/update',
  MY_AUCTIONS: '/my-auctions',
  CREATE_AUCTION: '/create-auction',
  AUCTION_DETAILS: '/auction/:id',
  PROFILE: '/profile',
  WINNING_AUCTIONS: '/winning-auctions',
};

// Navigation Links
export const NAV_LINKS: NavLinks = {
  MAIN: [
    { path: PUBLIC_ROUTES.HOME, label: 'Home' },
  ],
  AUTH: [
    { path: PUBLIC_ROUTES.LOGIN_REGISTER, label: 'Login/Register' },
  ],
  USER: [
    { path: PROTECTED_ROUTES.MY_CARDS, label: 'My Cards' },
    { path: PROTECTED_ROUTES.MY_AUCTIONS, label: 'My Auctions' },
    { path: PROTECTED_ROUTES.CREATE_AUCTION, label: 'Create Auction' },
    { path: PROTECTED_ROUTES.PROFILE, label: 'Profile' },
  ],
  ADMIN: [
    { path: PROTECTED_ROUTES.UNVALIDATED_CARDS, label: 'Validate Cards' },
  ],
};

// API Types and Constants
interface ApiEndpoints {
  SEARCH: string;
  AUCTIONS: string;
  CARDS: string;
  AUTH: string;
  USERS: string;
}

interface AppConstants {
  ITEMS_PER_PAGE: number;
  MAX_SEARCH_RESULTS: number;
  DEFAULT_AUCTION_DURATION: number;
}

interface ErrorMessages {
  AUTH: {
    LOGIN_FAILED: string;
    REGISTRATION_FAILED: string;
    UNAUTHORIZED: string;
  };
  AUCTION: {
    CREATE_FAILED: string;
    BID_FAILED: string;
    NOT_FOUND: string;
  };
  CARD: {
    VALIDATION_FAILED: string;
    UPLOAD_FAILED: string;
    NOT_FOUND: string;
  };
}

export const API_ENDPOINTS: ApiEndpoints = {
  SEARCH: '/api/search',
  AUCTIONS: '/api/auctions',
  CARDS: '/api/cards',
  AUTH: '/api/auth',
  USERS: '/api/users',
};

export const APP_CONSTANTS: AppConstants = {
  ITEMS_PER_PAGE: 12,
  MAX_SEARCH_RESULTS: 50,
  DEFAULT_AUCTION_DURATION: 7, // days
};

export const ERROR_MESSAGES: ErrorMessages = {
  AUTH: {
    LOGIN_FAILED: 'Invalid email or password',
    REGISTRATION_FAILED: 'Registration failed. Please try again.',
    UNAUTHORIZED: 'Please login to access this feature',
  },
  AUCTION: {
    CREATE_FAILED: 'Failed to create auction',
    BID_FAILED: 'Failed to place bid',
    NOT_FOUND: 'Auction not found',
  },
  CARD: {
    VALIDATION_FAILED: 'Card validation failed',
    UPLOAD_FAILED: 'Failed to upload card',
    NOT_FOUND: 'Card not found',
  },
}; 