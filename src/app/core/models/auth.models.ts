export interface LoginResponseDto {
  token: string;
  role: string;
  userId: string;
}

export interface UserProfile {
  profileId: number;
  emailId: string;
  fullName: string;
  mobileNumber: string | number;
  role: string;
  about?: string;
  dateOfBirth?: Date;
  gender?: string;
}
