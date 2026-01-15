export interface AuthUser {
  id: number;
  auth0Id: string;
  email: string;
  name?: string | null;
}
