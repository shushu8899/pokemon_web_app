"""
Test your routes here
"""
import requests

def auction_details_test():
    response = requests.get("http://localhost:8000/auction-details/1")
    print(response.json)
    assert response.status_code == 200
    


if __name__ == "__main__":
    # Remember to put print statements for testing
    print("Testing Get Auction Detail by ID")
    auction_details_test()