import axios from "axios";

export interface ValidatedCard {
  CardID: number;
  ImageURL: string;
  Name: string;
  Description: string;
}

export interface AuctionFormData {
  card_id?: number;
  starting_bid: number;
  minimum_increment: number;
  auction_duration: number;
}

export interface CreatedAuction {
  AuctionID: number;
  CardID: number;
  SellerID: number;
  MinimumIncrement: number;
  EndTime: string;
  Status: string;
  HighestBidderID: number | null;
  HighestBid: number;
  ImageURL: string;
}

// Get validated cards that can be put up for auction
export const getValidatedCards = async (): Promise<ValidatedCard[]> => {
  try {
    const response = await axios.get<ValidatedCard[]>("http://127.0.0.1:8000/seller_submission/validated-cards");
    return response.data;
  } catch (error) {
    console.error("Error fetching validated cards:", error);
    return [];
  }
};

// Create new auction
export const createAuction = async (formData: AuctionFormData): Promise<CreatedAuction | null> => {
  try {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value.toString());
    });
    
    const response = await axios.post<CreatedAuction>("http://127.0.0.1:8000/seller_submission/submit-auction", form);
    return response.data;
  } catch (error) {
    console.error("Error creating auction:", error);
    return null;
  }
};

// Get user's auctions
export const getMyAuctions = async (): Promise<number[]> => {
  try {
    const response = await axios.get<number[]>("http://127.0.0.1:8000/seller_submission/my-auctions");
    return response.data;
  } catch (error) {
    console.error("Error fetching user auctions:", error);
    return [];
  }
};

// Delete auction
export const deleteAuction = async (auctionId: number): Promise<boolean> => {
  try {
    await axios.delete(`http://127.0.0.1:8000/seller_submission/delete-auction/${auctionId}`);
    return true;
  } catch (error) {
    console.error("Error deleting auction:", error);
    return false;
  }
}; 