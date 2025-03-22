import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './WinningAuctionsPage.module.css';
import { getImageUrl } from '../utils/imageUtils';

interface WinningAuction {
  AuctionID: number;
  CardID: number;
  HighestBid: number;
  EndTime: string;
  IsValidated: boolean;
  CardName: string;
  CardQuality: string;
  ImageURL: string;
}

const WinningAuctionsPage: React.FC = () => {
  const [winningAuctions, setWinningAuctions] = useState<WinningAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWinningAuctions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:8000/winning-auctions', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setWinningAuctions(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch winning auctions');
      } finally {
        setLoading(false);
      }
    };

    fetchWinningAuctions();
  }, [navigate]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Winning Bids</h1>
      
      {winningAuctions.length === 0 ? (
        <div className={styles.noAuctions}>
          <p>You haven't won any auctions yet.</p>
        </div>
      ) : (
        <div className={styles.auctionGrid}>
          {winningAuctions.map((auction) => (
            <div key={auction.AuctionID} className={styles.auctionCard}>
              <img 
                src={getImageUrl(auction.ImageURL)}
                alt={auction.CardName}
                className="w-full h-64 object-contain rounded-lg"
              />
              <div className={styles.auctionInfo}>
                <h3 className={styles.cardName}>{auction.CardName}</h3>
                <p className={styles.cardQuality}>Quality: {auction.CardQuality}</p>
                <p className={styles.bidAmount}>Winning Bid: ${auction.HighestBid}</p>
                <p className={styles.endTime}>
                  Ended: {new Date(auction.EndTime).toLocaleString()}
                </p>
                <p className={styles.validationStatus}>
                  Status: {auction.IsValidated ? 'Validated' : 'Not Validated'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WinningAuctionsPage; 