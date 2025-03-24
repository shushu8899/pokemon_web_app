import api from './api';
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
  CardID: number;
  Status: string;
  HighestBid: number;
  EndTime: string;
  IsValidated: boolean;
  CardName: string;
  CardQuality: string;
  ImageURL: string;
  HighestBidderID?: number;
  HighestBidderUsername?: string;
  SellerUsername: string;
  MinimumIncrement: number;
  StartingBid: number;
  auction_duration?: number;
}

// Get validated cards that can be put up for auction
export const getValidatedCards = async (): Promise<ValidatedCard[]> => {
  try {
    const response = await api.get('/auction/validated-cards');
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
    console.log('Creating auction with data:', data);
    
    // Format the data for the API
    const formData = new FormData();
    formData.append('card_id', data.card_id.toString());
    formData.append('starting_bid', data.starting_bid.toString());
    formData.append('minimum_increment', data.minimum_increment.toString());
    formData.append('auction_duration', data.auction_duration.toString());

    console.log('Sending form data:', Object.fromEntries(formData));

    const response = await api.post('/auction/submit-auction', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
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
    console.log('Fetching user auctions');
    console.log('Making request to:', '/auction/my-auctions');
    
    const response = await api.get<MyAuction[]>("/auction/my-auctions");
    
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
    // First get the auction details to check if it has bids
    const auction = await getAuctionDetails(auctionId);
    if (auction.HighestBidderID) {
      throw new Error('Cannot delete auction that has active bids');
    }

    const response = await api.delete(`/auction/delete-auction/${auctionId}`);
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
    console.log('Fetching auction details for ID:', auctionId);
    
    // Use the seller-specific endpoint for viewing our own auction details
    const response = await api.get<MyAuction>(`/auction/auction-details/${auctionId}`);
    
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
        throw new Error('You do not have permission to view this auction. You can only view your own auctions.');
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
    // Check if there's a highest bidder
    if (auction.HighestBidderID) {
      throw new Error('You cannot update auction because it is already in progress');
    }
    
    const formData = new FormData();
    formData.append('minimum_increment', auction.MinimumIncrement.toString());
    formData.append('starting_bid', auction.StartingBid.toString());
    formData.append('auction_duration', (auction.auction_duration || 24).toString());

    console.log('Updating auction with data:', Object.fromEntries(formData));

    const response = await api.put(
      `/auction/update-auction/${auction.AuctionID}`,
      formData,
      {
        headers: {
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