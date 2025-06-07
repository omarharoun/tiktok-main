// PocketBase Migration Test File
// This file tests the basic functionality of all PocketBase services

import { pb } from "../../pocketbaseConfig";
import { AuthService } from "../services/auth";
import { UserService } from "../services/userPB";
import { PostService } from "../services/postsPB";
import { ChatService } from "../services/chatPB";

/**
 * Test PocketBase Connection
 */
export const testPocketBaseConnection = async () => {
  try {
    console.log("Testing PocketBase connection...");
    const health = await pb.health.check();
    console.log("✅ PocketBase connection successful:", health);
    return true;
  } catch (error) {
    console.error("❌ PocketBase connection failed:", error);
    return false;
  }
};

/**
 * Test Authentication Service
 */
export const testAuthService = async () => {
  console.log("Testing Authentication Service...");

  try {
    // Test if auth service methods exist
    const methods = [
      "signUp",
      "signIn",
      "signOut",
      "onAuthStateChange",
    ] as const;
    const missing = methods.filter(
      (method) => typeof (AuthService as any)[method] !== "function",
    );

    if (missing.length > 0) {
      console.error("❌ Missing auth methods:", missing);
      return false;
    }

    console.log("✅ All auth service methods exist");

    // Test auth state monitoring
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      console.log(
        "Auth state changed:",
        user ? "User logged in" : "User logged out",
      );
    });

    // Clean up
    if (typeof unsubscribe === "function") {
      unsubscribe();
      console.log("✅ Auth state monitoring works");
    }

    return true;
  } catch (error) {
    console.error("❌ Auth service test failed:", error);
    return false;
  }
};

/**
 * Test User Service
 */
export const testUserService = async () => {
  console.log("Testing User Service...");

  try {
    const methods = [
      "searchUsers",
      "changeFollowState",
      "updateUserField",
      "isFollowing",
    ] as const;
    const missing = methods.filter(
      (method) => typeof (UserService as any)[method] !== "function",
    );

    if (missing.length > 0) {
      console.error("❌ Missing user service methods:", missing);
      return false;
    }

    console.log("✅ All user service methods exist");
    return true;
  } catch (error) {
    console.error("❌ User service test failed:", error);
    return false;
  }
};

/**
 * Test Post Service
 */
export const testPostService = async () => {
  console.log("Testing Post Service...");

  try {
    const methods = [
      "createPost",
      "getPosts",
      "getPostsByUser",
      "getFollowingFeed",
      "deletePost",
      "likePost",
      "unlikePost",
      "addComment",
      "getComments",
    ] as const;
    const missing = methods.filter(
      (method) => typeof (PostService as any)[method] !== "function",
    );

    if (missing.length > 0) {
      console.error("❌ Missing post service methods:", missing);
      return false;
    }

    console.log("✅ All post service methods exist");
    return true;
  } catch (error) {
    console.error("❌ Post service test failed:", error);
    return false;
  }
};

/**
 * Test Chat Service
 */
export const testChatService = async () => {
  console.log("Testing Chat Service...");

  try {
    const methods = ["getChats", "getMessages", "sendMessage"] as const;
    const missing = methods.filter(
      (method) => typeof (ChatService as any)[method] !== "function",
    );

    if (missing.length > 0) {
      console.error("❌ Missing chat service methods:", missing);
      return false;
    }

    console.log("✅ All chat service methods exist");
    return true;
  } catch (error) {
    console.error("❌ Chat service test failed:", error);
    return false;
  }
};

/**
 * Run All Tests
 */
export const runAllTests = async () => {
  console.log("🚀 Starting PocketBase Migration Tests...\n");

  const results = await Promise.all([
    testPocketBaseConnection(),
    testAuthService(),
    testUserService(),
    testPostService(),
    testChatService(),
  ]);

  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log("🎉 All tests passed! Migration appears successful.");
  } else {
    console.log("⚠️ Some tests failed. Check the logs above for details.");
  }

  return passed === total;
};

// Export all test functions
export default {
  testPocketBaseConnection,
  testAuthService,
  testUserService,
  testPostService,
  testChatService,
  runAllTests,
};
