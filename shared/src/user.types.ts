export enum UserRole {
  RIDER = 'rider',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export interface IUser {
  _id: string;
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: UserRole;
  homeStop?: string;
  isApproved: boolean;
  isEmailVerified: boolean;
  fcmToken?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
}

export interface IUserUpdate {
  name?: string;
  phone?: string;
  homeStop?: string;
  fcmToken?: string;
  isApproved?: boolean;
  avatar?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  inviteToken: string;
}

export interface IAuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
}
