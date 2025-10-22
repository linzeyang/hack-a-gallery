export interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  prizes: Prize[];
  requirements: string;
  organizerId: string;
  organizerName: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Prize {
  id: string;
  title: string;
  amount: string;
  description: string;
  maxWinners: number;
  currentWinners: number;
}
