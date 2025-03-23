export const calculateTimeLeft = (endTime: number) => {  // ✅ Expect Unix timestamp in seconds
  const now = Math.floor(Date.now() / 1000);  // ✅ Convert current time to seconds
  const difference = endTime - now;

  if (difference <= 0) return { expired: true, timeLeft: "Expired" };

  const days = Math.floor(difference / (60 * 60 * 24));
  const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((difference % (60 * 60)) / 60);
  const seconds = Math.floor(difference % 60);  // ✅ Add seconds

  return {
    expired: false,
    timeLeft: `${days}d ${hours}h ${minutes}m ${seconds}s`  // ✅ Include seconds
  };
};
