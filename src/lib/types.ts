export interface TimeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  customer: string;
  hours: number;
  userId: string;
}

export interface User {
  id: string;
  name: string;
}
