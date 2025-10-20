export interface User {
  id: string;
  name: string;
  email: string;
  role: 'hacker' | 'organizer' | 'investor';
  githubUsername?: string;
}
