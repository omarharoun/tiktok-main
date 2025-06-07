# PocketBase Error Troubleshooting Guide

This document provides detailed troubleshooting information for common PocketBase errors in the TikTok clone application.

## 📋 Table of Contents

1. [Authentication Errors](#authentication-errors)
2. [User Profile Errors](#user-profile-errors)
3. [Like System Errors](#like-system-errors)
4. [Follow System Errors](#follow-system-errors)
5. [General Troubleshooting](#general-troubleshooting)

---

## 🔐 Authentication Errors

### Error: `Sign in failed: [ClientResponseError 400: Failed to authenticate.]`

**Location:** `src/services/auth.ts:15`

**Root Causes:**

1. **Invalid credentials** - Wrong email/password combination
2. **Account not verified** - User account exists but isn't verified
3. **Account disabled** - User account has been disabled by admin
4. **PocketBase server issues** - Connection or server-side errors

**Debugging Steps:**

```bash
# Check PocketBase server status
curl http://164.92.139.226:8090/api/health

# Test authentication manually
curl -X POST http://164.92.139.226:8090/api/collections/users/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"user@example.com","password":"password123"}'
```

**Solutions:**

1. **Verify credentials** - Ensure email and password are correct
2. **Check user status** - Verify account exists in PocketBase admin panel
3. **Reset password** - Use PocketBase password reset functionality
4. **Server connectivity** - Ensure PocketBase server is accessible

**Code Implementation:**

```typescript
// Enhanced error handling in AuthService.signIn
static async signIn(email: string, password: string): Promise<User> {
  try {
    const authData = await pb
      .collection(Collections.USERS)
      .authWithPassword(email, password);
    return authData.record as unknown as User;
  } catch (error: any) {
    console.error("Sign in failed:", error);

    // Enhanced error messages
    if (error.status === 400) {
      throw new Error("Invalid email or password");
    } else if (error.status === 403) {
      throw new Error("Account is disabled or not verified");
    } else if (error.status >= 500) {
      throw new Error("Server error. Please try again later");
    }

    throw error;
  }
}
```

### Error: `Sign up failed: [ClientResponseError 400: Failed to create record.]`

**Location:** `src/services/auth.ts:47`

**Root Causes:**

1. **Email already exists** - User with this email already registered
2. **Invalid email format** - Malformed email address
3. **Weak password** - Password doesn't meet requirements
4. **Missing required fields** - Required user fields not provided
5. **Validation rules** - PocketBase collection validation failed

**Debugging Steps:**

```bash
# Check if email exists
curl "http://164.92.139.226:8090/api/collections/users/records?filter=email='user@example.com'"

# Test user creation manually
curl -X POST http://164.92.139.226:8090/api/collections/users/records \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","passwordConfirm":"password123"}'
```

**Solutions:**

1. **Check email uniqueness** - Verify email isn't already registered
2. **Validate input** - Ensure email format and password strength
3. **Review schema** - Check PocketBase users collection requirements
4. **Add field validation** - Implement client-side validation

**Code Implementation:**

```typescript
// Enhanced validation in AuthService.signUp
static async signUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<User> {
  try {
    // Client-side validation
    if (!email || !email.includes('@')) {
      throw new Error("Invalid email format");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

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
    await pb.collection(Collections.USERS).authWithPassword(email, password);

    return user as unknown as User;
  } catch (error: any) {
    console.error("Sign up failed:", error);

    if (error.data?.email?.message) {
      throw new Error("Email is already registered");
    } else if (error.data?.password?.message) {
      throw new Error("Password is too weak");
    }

    throw error;
  }
}
```

---

## 👤 User Profile Errors

### Error: `Failed to save user profile image: [ClientResponseError 0: Something went wrong while processing your request.]`

**Location:** `src/services/userPB.ts:20`

**Root Causes:**

1. **Network connectivity** - Connection to PocketBase server lost
2. **File size limits** - Image file exceeds PocketBase limits
3. **File type restrictions** - Unsupported image format
4. **Authentication expired** - User session has expired
5. **Server storage issues** - PocketBase server storage problems

**Debugging Steps:**

```bash
# Check file size and type
ls -lh /path/to/image.jpg

# Test file upload manually
curl -X PATCH http://164.92.139.226:8090/api/collections/users/records/USER_ID \
  -H "Authorization: Bearer TOKEN" \
  -F "avatar=@image.jpg"

# Check PocketBase settings
curl http://164.92.139.226:8090/api/settings
```

**Solutions:**

1. **Check file constraints** - Ensure image is under size limit (usually 5MB)
2. **Validate format** - Use supported formats (JPEG, PNG, WebP)
3. **Compress images** - Reduce file size before upload
4. **Re-authenticate** - Refresh user session if expired
5. **Retry mechanism** - Implement retry logic for network issues

**Code Implementation:**

```typescript
// Enhanced image upload with validation
static async saveUserProfileImage(imageFile: File | Blob): Promise<void> {
  try {
    const currentUser = pb.authStore.model;
    if (!currentUser?.id) {
      throw new Error("No authenticated user");
    }

    // Validate file size (5MB limit)
    if (imageFile.size > 5 * 1024 * 1024) {
      throw new Error("Image file too large. Maximum size is 5MB");
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (imageFile instanceof File && !allowedTypes.includes(imageFile.type)) {
      throw new Error("Unsupported image format. Use JPEG, PNG, or WebP");
    }

    const formData = new FormData();
    formData.append("avatar", imageFile);

    await pb.collection(Collections.USERS).update(currentUser.id, formData);
  } catch (error: any) {
    console.error("Failed to save user profile image:", error);

    if (error.status === 0) {
      throw new Error("Network error. Please check your connection");
    } else if (error.status === 401) {
      throw new Error("Session expired. Please log in again");
    } else if (error.status === 413) {
      throw new Error("File too large");
    }

    throw error;
  }
}
```

---

## ❤️ Like System Errors

### Error: `Error updating user like count: [ClientResponseError 404: Missing required record id.]`

**Location:** `src/services/postsPB.ts:144`

**Root Causes:**

1. **Invalid post ID** - Post doesn't exist or was deleted
2. **Invalid user ID** - User doesn't exist or was deleted
3. **Race conditions** - Multiple like operations happening simultaneously
4. **Database integrity** - Orphaned records or broken relationships

**Debugging Steps:**

```bash
# Check if post exists
curl "http://164.92.139.226:8090/api/collections/posts/records/POST_ID"

# Check if user exists
curl "http://164.92.139.226:8090/api/collections/users/records/USER_ID"

# Check likes collection
curl "http://164.92.139.226:8090/api/collections/likes/records?filter=post='POST_ID'"
```

**Solutions:**

1. **Validate IDs** - Ensure post and user IDs exist before operations
2. **Add error handling** - Gracefully handle missing records
3. **Implement locks** - Prevent race conditions with proper sequencing
4. **Database cleanup** - Remove orphaned records

**Code Implementation:**

```typescript
// Enhanced like count update with validation
private static async updateUserLikeCount(
  postId: string,
  increment: number,
): Promise<void> {
  try {
    // Validate post exists
    const post = await pb.collection(Collections.POSTS).getOne(postId);

    if (!post.user) {
      console.error("Post has no associated user");
      return;
    }

    // Validate user exists
    const user = await pb.collection(Collections.USERS).getOne(post.user);

    await pb.collection(Collections.USERS).update(post.user, {
      likesCount: Math.max(0, (user.likesCount || 0) + increment),
    });
  } catch (error: any) {
    console.error("Error updating user like count:", error);

    if (error.status === 404) {
      console.warn("Post or user not found, skipping like count update");
      return; // Gracefully handle missing records
    }

    throw error;
  }
}
```

---

## 👥 Follow System Errors

### Error: `Error changing follow state: [TypeError: this.updateFollowCounts is not a function (it is undefined)]`

**Location:** `src/services/userPB.ts:141`

**Root Causes:**

1. **Method binding issues** - `this` context lost in async calls
2. **Class method not defined** - Method doesn't exist or was renamed
3. **Import/export problems** - Incorrect module imports
4. **Scope issues** - Method called from wrong context

**Debugging Steps:**

```typescript
// Check if method exists
console.log(typeof UserService.updateFollowCounts); // Should be 'function'

// Check method binding
console.log(UserService.updateFollowCounts); // Should not be undefined
```

**Solutions:**

1. **Fix method binding** - Ensure proper `this` context
2. **Use arrow functions** - Maintain context in callbacks
3. **Static method calls** - Use class name instead of `this`
4. **Method validation** - Check method exists before calling

**Code Implementation:**

```typescript
// Fixed follow state change with proper method calls
static async changeFollowState(
  otherUserId: string,
  currentFollowState: boolean,
): Promise<boolean> {
  try {
    const currentUser = pb.authStore.model;
    if (!currentUser?.id) {
      throw new Error("No authenticated user");
    }

    if (currentFollowState) {
      // Unfollow
      const result = await pb.collection(Collections.FOLLOWING).getList(1, 1, {
        filter: `follower = "${currentUser.id}" && following = "${otherUserId}"`,
      });

      if (result.items.length > 0) {
        await pb.collection(Collections.FOLLOWING).delete(result.items[0].id);
        // Fixed: Use static method call instead of this
        await UserService.updateFollowCounts(currentUser.id, otherUserId, -1);
      }
    } else {
      // Follow
      await pb.collection(Collections.FOLLOWING).create({
        follower: currentUser.id,
        following: otherUserId,
      });

      // Fixed: Use static method call instead of this
      await UserService.updateFollowCounts(currentUser.id, otherUserId, 1);
    }

    return true;
  } catch (error) {
    console.error("Error changing follow state:", error);
    return false;
  }
}

// Ensure updateFollowCounts is properly defined as static
private static async updateFollowCounts(
  followerId: string,
  followingId: string,
  increment: number,
): Promise<void> {
  try {
    const [follower, following] = await Promise.all([
      pb.collection(Collections.USERS).getOne(followerId),
      pb.collection(Collections.USERS).getOne(followingId),
    ]);

    await Promise.all([
      pb.collection(Collections.USERS).update(followerId, {
        followingCount: Math.max(0, (follower.followingCount || 0) + increment),
      }),
      pb.collection(Collections.USERS).update(followingId, {
        followersCount: Math.max(0, (following.followersCount || 0) + increment),
      }),
    ]);
  } catch (error) {
    console.error("Error updating follow counts:", error);
  }
}
```

---

## 🔧 General Troubleshooting

### Common Debugging Steps

1. **Check PocketBase Server Status:**

```bash
curl http://164.92.139.226:8090/api/health
```

2. **Verify Authentication:**

```typescript
console.log("Auth valid:", pb.authStore.isValid);
console.log("Current user:", pb.authStore.model);
```

3. **Check Network Connectivity:**

```typescript
// Test basic connectivity
fetch("http://164.92.139.226:8090/api/health")
  .then((response) => console.log("Server reachable:", response.ok))
  .catch((error) => console.log("Server unreachable:", error));
```

4. **Enable Debug Logging:**

```typescript
// Add to pocketbaseConfig.ts
if (__DEV__) {
  pb.beforeSend = function (url, options) {
    console.log("PB Request:", url, options);
    return { url, options };
  };

  pb.afterSend = function (response, data) {
    console.log("PB Response:", response.status, data);
    return data;
  };
}
```

### Best Practices for Error Prevention

1. **Input Validation:**

```typescript
// Always validate inputs before API calls
if (!email || !password) {
  throw new Error("Email and password are required");
}
```

2. **Graceful Error Handling:**

```typescript
try {
  await apiCall();
} catch (error: any) {
  // Log for debugging
  console.error("API Error:", error);

  // User-friendly error messages
  const userMessage =
    error.status === 404
      ? "Record not found"
      : "Something went wrong. Please try again.";

  throw new Error(userMessage);
}
```

3. **Retry Logic for Network Errors:**

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error.status === 0 && i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

4. **Authentication State Management:**

```typescript
// Check auth before sensitive operations
private static ensureAuthenticated() {
  if (!pb.authStore.isValid || !pb.authStore.model?.id) {
    throw new Error("Authentication required");
  }
}
```

### Error Monitoring and Logging

Consider implementing centralized error tracking:

```typescript
// errorLogger.ts
export class ErrorLogger {
  static log(error: any, context: string) {
    console.error(`[${context}]`, error);

    // Send to error tracking service (e.g., Sentry)
    if (typeof error === "object") {
      // Track structured errors
      console.log("Error details:", {
        message: error.message,
        status: error.status,
        context,
        timestamp: new Date().toISOString(),
        user: pb.authStore.model?.id,
      });
    }
  }
}
```

This comprehensive guide should help you debug and resolve the most common PocketBase errors in your TikTok clone application.
