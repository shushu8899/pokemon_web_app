// Default user credentials
const DEFAULT_AUTH = {
    email: 'sheryl.tan.2023@mitb.smu.edu.sg',
    access_token: 'eyJraWQiOiJLQ0pzc2w0ZG0rUm4yQ0RVZWk5cDdHOHExSEE3WmFSOVd5cFhydEYrcUhZPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJmOTZhOTU2Yy1mMGIxLTcwMTgtZjBlOC1mNTc5NTI5M2FkMTciLCJjb2duaXRvOmdyb3VwcyI6WyJVc2VycyJdLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtc291dGhlYXN0LTFfa2RXekp5elRuIiwiY2xpZW50X2lkIjoibHZxZGw5YXE3dTliZjBuazNlbXNlbzdkcCIsIm9yaWdpbl9qdGkiOiIxNGQ0Mjg0My1hZjg1LTRjMGMtYjQ0Yi1mOTI4OTgzMTg2ZjYiLCJldmVudF9pZCI6IjIzYjA2ZDcwLWUzY2QtNDBjNi05MmY3LTMxZGU4ZmNjZDQ5OCIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3NDE0OTUzNzQsImV4cCI6MTc0MTQ5ODk3NCwiaWF0IjoxNzQxNDk1Mzc0LCJqdGkiOiIzYjNiYmMyNC1lYjY1LTRhMzEtYmJjMS1lNDVlOGY5MjI1NmYiLCJ1c2VybmFtZSI6ImY5NmE5NTZjLWYwYjEtNzAxOC1mMGU4LWY1Nzk1MjkzYWQxNyJ9.axMqSCw17t_QQRb-aLX7dVxsMydCO8yPaAfbLgbk7J4tpU25G6sVjJpxRYDA6iesRY2dwVnhTcvsRDrTf-kwyV_EkPliQ54ibQ_gRq7Pv2P92i-yd3VBGtELqwlGbPH7VsxrQiofEma23lyJz48aQ8DKzAsCoxlLBltu85AeDPA_01A9c2wiU2GfewBVm9LSz9sumwiExehn4AOWRbRR-Bkav75ouRH2pNultGYS1tkMe8f3szpWJO305TJiah6sDci_npw2tOzZ9DyvfB-hzEydS5I5R2SQnzxHLkXfqrEusv9tVJ928zHndPmDN1MgKMwQDCJByZCMmeSBdqruqA'
};

// Initialize default authentication
export const initializeDefaultAuth = () => {
    localStorage.setItem('access_token', DEFAULT_AUTH.access_token);
    localStorage.setItem('user_email', DEFAULT_AUTH.email);
};

// Get the access token
export const getAccessToken = () => {
    return localStorage.getItem('access_token') || DEFAULT_AUTH.access_token;
};

// Get the user email
export const getUserEmail = () => {
    return localStorage.getItem('user_email') || DEFAULT_AUTH.email;
}; 