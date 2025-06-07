import { pb, Collections } from "../../pocketbaseConfig";
import { User } from "../../types";

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const authData = await pb
        .collection(Collections.USERS)
        .authWithPassword(email, password);
      return authData.record as unknown as User;
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<User> {
    try {
      // Create user account
      const userData = {
        email,
        password,
        passwordConfirm: password,
        displayName: displayName || "",
        followingCount: 0,
        followersCount: 0,
        likesCount: 0,
      };

      const user = await pb.collection(Collections.USERS).create(userData);

      // Auto-authenticate after creation
      await pb.collection(Collections.USERS).authWithPassword(email, password);

      return user as unknown as User;
    } catch (error) {
      console.error("Sign up failed:", error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    pb.authStore.clear();
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser(): User | null {
    if (pb.authStore.isValid && pb.authStore.model) {
      return pb.authStore.model as unknown as User;
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return pb.authStore.isValid;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      callback(model as unknown as User | null);
    });

    return unsubscribe;
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    data: Partial<User>,
  ): Promise<User> {
    try {
      const updatedUser = await pb
        .collection(Collections.USERS)
        .update(userId, data);
      return updatedUser as unknown as User;
    } catch (error) {
      console.error("Profile update failed:", error);
      throw error;
    }
  }

  /**
   * Upload and update user avatar
   */
  static async updateAvatar(
    userId: string,
    imageFile: File | Blob,
  ): Promise<User> {
    try {
      const formData = new FormData();
      formData.append("avatar", imageFile);

      const updatedUser = await pb
        .collection(Collections.USERS)
        .update(userId, formData);
      return updatedUser as unknown as User;
    } catch (error) {
      console.error("Avatar update failed:", error);
      throw error;
    }
  }

  /**
   * Refresh user data
   */
  static async refreshUser(): Promise<User | null> {
    try {
      if (!pb.authStore.model?.id) return null;

      const user = await pb
        .collection(Collections.USERS)
        .getOne(pb.authStore.model.id);

      // Update auth store with fresh data
      pb.authStore.save(pb.authStore.token, user);

      return user as unknown as User;
    } catch (error) {
      console.error("User refresh failed:", error);
      return null;
    }
  }
}

export default AuthService;
