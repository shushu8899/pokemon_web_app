import axios from "axios";
import { getAuthorizationHeader } from './auth-service';

export interface ValidatedCard {
  CardID: number;
  CardName: string;
  CardQuality: string;
  ImageURL: string;
  IsValidated: boolean;
  OwnerID: number;
}

export interface AuctionFormData {
  card_id: number;
  starting_bid: number;
  minimum_increment: number;
  auction_duration: number;
}

export interface CreatedAuction {
  auction_id: number;
  card_id: number;
  starting_bid: number;
  current_bid: number;
  minimum_increment: number;
  end_time: string;
}

export interface MyAuction {
  AuctionID: number;
  SellerID: number;
  CardID: number;
  StartingBid: number;
  MinimumIncrement: number;
  EndTime: string;
  Status: string;
  HighestBidderID: number | null;
  HighestBid: number;
  CardName: string;
  CardQuality: string;
  ImageURL: string | null;
  IsValidated: boolean;
  auction_duration?: number;
}

// Get validated cards that can be put up for auction
export const getValidatedCards = async (): Promise<ValidatedCard[]> => {
  try {
    const authHeader = getAuthorizationHeader();
    if (!authHeader) {
      throw new Error('You must be logged in to view validated cards');
    }

    const response = await axios.get('http://127.0.0.1:8000/auction/validated-cards', {
      headers: {
        'Authorization': authHeader
      }
    });
    console.log('API Response for validated cards:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('Authentication error:', error.response.data);
      throw new Error('Authentication failed. Please log in again.');
    }
    console.error('Error fetching validated cards:', error);
    throw error;
  }
};

// Create new auction
export const createAuction = async (data: AuctionFormData): Promise<CreatedAuction> => {
  try {
    const authHeader = getAuthorizationHeader();
    if (!authHeader) {
      throw new Error('You must be logged in to create an auction');
    }

    console.log('Creating auction with data:', data);
    
    // Format the data for the API
    const formData = new FormData();
    formData.append('card_id', data.card_id.toString());
    formData.append('starting_bid', data.starting_bid.toString());
    formData.append('minimum_increment', data.minimum_increment.toString());
    formData.append('auction_duration', data.auction_duration.toString());

    console.log('Sending form data:', Object.fromEntries(formData));

    const response = await axios.post('http://127.0.0.1:8000/auction/submit-auction', formData, {
      headers: {
        'Authorization': authHeader
      }
    });
    
    console.log('Auction creation response:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('Authentication error:', error.response.data);
      throw new Error('Authentication failed. Please log in again.');
    }
    if (error.response?.status === 422) {
      console.error('Validation error details:', error.response.data);
      const validationErrors = error.response.data.detail;
      if (Array.isArray(validationErrors)) {
        const errorMessages = validationErrors.map(err => {
          console.log('Validation error:', err);
          const field = err.loc[err.loc.length - 1];
          return `${field}: ${err.msg}`;
        });
        throw new Error(errorMessages.join(', '));
      } else if (typeof validationErrors === 'string') {
        throw new Error(validationErrors);
      } else {
        throw new Error('Invalid input data. Please check your auction details.');
      }
    }
    console.error('Error creating auction:', error);
    throw error;
  }
};

// Get user's auctions
export const getMyAuctions = async (): Promise<MyAuction[]> => {
  try {
    const authHeader = getAuthorizationHeader();
    if (!authHeader) {
      throw new Error('You must be logged in to view your auctions');
    }

    console.log('Fetching user auctions with token:', authHeader);
    console.log('Making request to:', 'http://127.0.0.1:8000/auction/my-auctions');
    
    const response = await axios.get<MyAuction[]>("http://127.0.0.1:8000/auction/my-auctions", {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('My auctions response:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error('Server error details:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        error: error.message
      });
      if (error.response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(`Server error: ${error.response.data.detail || error.message || 'Unknown server error'}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response received from server');
    } else {
      console.error('Error setting up request:', error.message);
      throw new Error(`Error: ${error.message}`);
    }
  }
};

// Delete auction
export const deleteAuction = async (auctionId: number): Promise<boolean> => {
  try {
    const authHeader = getAuthorizationHeader();
    if (!authHeader) {
      throw new Error('You must be logged in to delete auctions');
    }
    
    // First get the auction details to check if it has bids
    const auction = await getAuctionDetails(auctionId);
    if (auction.HighestBidderID) {
      throw new Error('Cannot delete auction that has active bids');
    }

    const response = await axios.delete(`http://127.0.0.1:8000/auction/delete-auction/${auctionId}`, {
      headers: {
        'Authorization': authHeader
      }
    });

    return response.status === 200;
  } catch (error: any) {
    console.error("Error deleting auction:", error);
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete this auction');
    } else if (error.response?.status === 404) {
      throw new Error('Auction not found');
    }
    throw error;
  }
};

// Get auction details
export const getAuctionDetails = async (auctionId: number): Promise<MyAuction> => {
  try {
    const authHeader = getAuthorizationHeader();
    if (!authHeader) {
      throw new Error('You must be logged in to view auction details');
    }

    console.log('Fetching auction details for ID:', auctionId);
    const response = await axios.get<MyAuction>(`http://127.0.0.1:8000/auction/auction-details/${auctionId}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Auction details response:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error('Server error details:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        error: error.message
      });
      if (error.response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response.status === 403) {
        throw new Error('You do not have permission to view this auction');
      } else if (error.response.status === 404) {
        throw new Error('Auction not found');
      }
      throw new Error(`Server error: ${error.response.data.detail || error.message || 'Unknown server error'}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response received from server');
    } else {
      console.error('Error setting up request:', error.message);
      throw new Error(`Error: ${error.message}`);
    }
  }
};

// Update auction
export const updateAuction = async (auction: MyAuction): Promise<MyAuction> => {
  try {
    const authHeader = getAuthorizationHeader();
    if (!authHeader) {
      throw new Error('You must be logged in to update auctions');
    }

    // Check if there's a highest bidder
    if (auction.HighestBidderID) {
      throw new Error('You cannot update auction because it is already in progress');
    }
    
    const formData = new FormData();
    formData.append('minimum_increment', auction.MinimumIncrement.toString());
    formData.append('starting_bid', auction.StartingBid.toString());
    formData.append('auction_duration', (auction.auction_duration || 24).toString());

    console.log('Updating auction with data:', Object.fromEntries(formData));

    const response = await axios.put(
      `http://127.0.0.1:8000/auction/update-auction/${auction.AuctionID}`,
      formData,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    console.log('Update response:', response.data);

    // Return the updated auction data
    return {
      ...auction,
      ...response.data,
      StartingBid: response.data.HighestBid // Ensure StartingBid is synced with HighestBid
    };
  } catch (error: any) {
    console.error('Error updating auction:', error);
    if (error.response?.status === 422) {
      console.error('Validation error details:', error.response.data);
      throw new Error(error.response.data.detail || 'Validation error occurred');
    }
    throw error;
  }
};