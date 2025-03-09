import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuctionDetails, deleteAuction, updateAuction } from '../services/auction-creation';
import { MyAuction } from '../services/auction-creation';

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '20px auto'
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  cardHeader: {
    padding: '15px 20px',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardBody: {
    padding: '20px'
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    margin: '0 -15px'
  },
  column: {
    flex: '1',
    padding: '0 15px',
    minWidth: '300px'
  },
  image: {
    maxWidth: '100%',
    maxHeight: '400px',
    objectFit: 'contain' as const,
    marginBottom: '15px'
  },
  button: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    marginLeft: '10px',
    fontSize: '14px'
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: 'white'
  },
  dangerButton: {
    backgroundColor: '#dc3545',
    color: 'white'
  },
  heading: {
    margin: '0',
    fontSize: '24px'
  },
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px'
  },
  alert: {
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  alertDanger: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
  },
  alertWarning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    border: '1px solid #ffeeba'
  },
  input: {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: 'white'
  }
};

const AuctionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<MyAuction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAuction, setEditedAuction] = useState<MyAuction | null>(null);
  const [auctionDuration, setAuctionDuration] = useState<number>(24); // Default 24 hours

  useEffect(() => {
    const fetchAuctionDetails = async () => {
      if (!id) {
        setError('Auction ID is required');
        setLoading(false);
        return;
      }

      try {
        const data = await getAuctionDetails(parseInt(id));
        setAuction(data);
        setEditedAuction(data);
        
        // Calculate initial auction duration from end time
        if (data.EndTime) {
          const endTime = new Date(data.EndTime);
          const now = new Date();
          const durationHours = Math.max(0, Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60)));
          setAuctionDuration(durationHours);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch auction details');
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionDetails();
  }, [id]);

  const calculateEndTime = (durationHours: number): string => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + durationHours);
    return endTime.toISOString();
  };

  const handleDurationChange = (hours: number) => {
    setAuctionDuration(hours);
    if (editedAuction) {
      setEditedAuction({
        ...editedAuction,
        EndTime: calculateEndTime(hours),
        auction_duration: hours
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedAuction) return;

    try {
      const auctionToUpdate = {
        ...editedAuction,
        auction_duration: auctionDuration
      };
      const updatedAuction = await updateAuction(auctionToUpdate);
      setAuction(updatedAuction);
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setEditedAuction(auction);
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (field: keyof MyAuction, value: any) => {
    if (editedAuction) {
      setEditedAuction({
        ...editedAuction,
        [field]: value
      });
    }
  };

  const handleDelete = async () => {
    if (!auction) return;

    if (auction.HighestBidderID) {
      setError('Cannot delete auction that has active bids');
      return;
    }

    if (window.confirm('Are you sure you want to delete this auction?')) {
      try {
        await deleteAuction(auction.AuctionID);
        navigate('/my-auctions');
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{...styles.alert, ...styles.alertDanger}}>{error}</div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div style={styles.container}>
        <div style={{...styles.alert, ...styles.alertWarning}}>Auction not found</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.heading}>Auction Details</h3>
          <div>
            {!isEditing ? (
              <>
                <button 
                  onClick={handleEdit} 
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                    opacity: auction.HighestBidderID ? 0.5 : 1,
                    cursor: auction.HighestBidderID ? 'not-allowed' : 'pointer'
                  }}
                  disabled={auction.HighestBidderID !== null}
                  title={auction.HighestBidderID ? "Cannot edit auction with active bids" : "Edit Auction"}
                >
                  Edit Auction
                </button>
                <button 
                  onClick={handleDelete} 
                  style={{
                    ...styles.button,
                    ...styles.dangerButton,
                    opacity: auction.HighestBidderID ? 0.5 : 1,
                    cursor: auction.HighestBidderID ? 'not-allowed' : 'pointer'
                  }}
                  disabled={auction.HighestBidderID !== null}
                  title={auction.HighestBidderID ? "Cannot delete auction with active bids" : "Delete Auction"}
                >
                  Delete Auction
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleSave} 
                  style={{...styles.button, ...styles.saveButton}}
                >
                  Save
                </button>
                <button 
                  onClick={handleCancel} 
                  style={{...styles.button, ...styles.dangerButton}}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.row}>
            <div style={styles.column}>
              {auction.ImageURL && (
                <img
                  src={auction.ImageURL.startsWith('http') 
                    ? auction.ImageURL 
                    : `http://127.0.0.1:8000${auction.ImageURL}`}
                  alt={auction.CardName}
                  style={styles.image}
                />
              )}
            </div>
            <div style={styles.column}>
              {isEditing ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ width: '150px' }}>Card Name:</strong>
                    <input
                      type="text"
                      value={editedAuction?.CardName || ''}
                      style={{ 
                        ...styles.input, 
                        margin: 0, 
                        backgroundColor: '#f5f5f5',
                        color: '#666',
                        cursor: 'not-allowed' 
                      }}
                      placeholder="Card Name"
                      disabled
                      readOnly
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ width: '150px' }}>Quality:</strong>
                    <input
                      type="text"
                      value={editedAuction?.CardQuality || ''}
                      style={{ 
                        ...styles.input, 
                        margin: 0, 
                        backgroundColor: '#f5f5f5',
                        color: '#666',
                        cursor: 'not-allowed' 
                      }}
                      placeholder="Card Quality"
                      disabled
                      readOnly
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ width: '150px' }}>Starting Bid:</strong>
                    <input
                      type="number"
                      value={editedAuction?.StartingBid || 0}
                      onChange={(e) => handleInputChange('StartingBid', parseFloat(e.target.value))}
                      style={{ ...styles.input, margin: 0 }}
                      placeholder="Starting Bid"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ width: '150px' }}>Minimum Increment:</strong>
                    <input
                      type="number"
                      value={editedAuction?.MinimumIncrement || 0}
                      onChange={(e) => handleInputChange('MinimumIncrement', parseFloat(e.target.value))}
                      style={{ ...styles.input, margin: 0 }}
                      placeholder="Minimum Increment"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ width: '150px' }}>Auction Duration (hours):</strong>
                    <div style={{ flex: 1 }}>
                      <input
                        type="number"
                        value={auctionDuration}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                        style={{ ...styles.input, margin: 0 }}
                        min="1"
                        placeholder="Duration in hours"
                      />
                      <p style={{ marginTop: '5px', color: '#666' }}>
                        End Time: {new Date(editedAuction?.EndTime || '').toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h4>{auction.CardName}</h4>
                  <p><strong>Quality:</strong> {auction.CardQuality}</p>
                  <p><strong>Status:</strong> {auction.Status}</p>
                  {auction.HighestBidderID ? (
                    <p><strong>Current Bid:</strong> ${auction.HighestBid}</p>
                  ) : (
                    <>
                      <p><strong>Current Bid:</strong> $0</p>
                      <p><strong>Starting Bid:</strong> ${auction.StartingBid}</p>
                    </>
                  )}
                  <p><strong>Minimum Increment:</strong> ${auction.MinimumIncrement}</p>
                  <p><strong>End Time:</strong> {new Date(auction.EndTime).toLocaleString()}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetails; 