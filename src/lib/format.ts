export const formatDateTime = (ts: number) =>
  new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false }).format(new Date(ts));

