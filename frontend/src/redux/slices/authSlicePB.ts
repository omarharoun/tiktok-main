import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import AuthService from "../../services/auth";
import { User } from "../../../types";
import { getPostsByUser } from "./postSlicePB";

export const userAuthStateListener = createAsyncThunk(
  "auth/userAuthStateListener",
  async (_, { dispatch }) => {
    // Check initial auth state
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      dispatch(setUserState({ currentUser, loaded: true }));
      dispatch(getPostsByUser(currentUser.id));
    } else {
      dispatch(setUserState({ currentUser: null, loaded: true }));
    }

    // Listen for future changes
    AuthService.onAuthStateChange((user) => {
      if (user) {
        dispatch(setUserState({ currentUser: user, loaded: true }));
        dispatch(getPostsByUser(user.id));
      } else {
        dispatch(setUserState({ currentUser: null, loaded: true }));
      }
    });
  },
);

export const getCurrentUserData = createAsyncThunk(
  "auth/getCurrentUserData",
  async (_, { dispatch }) => {
    const user = await AuthService.refreshUser();
    if (user) {
      dispatch(setUserState({ currentUser: user, loaded: true }));
    } else {
      dispatch(setUserState({ currentUser: null, loaded: true }));
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { email: string; password: string }) => {
    const { email, password } = payload;
    return await AuthService.signIn(email, password);
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload: {
    email: string;
    password: string;
    displayName?: string;
  }) => {
    const { email, password, displayName } = payload;
    return await AuthService.signUp(email, password, displayName);
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await AuthService.signOut();
});

interface AuthState {
  currentUser: User | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  currentUser: null,
  loaded: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserState: (state, action) => {
      state.currentUser = action.payload.currentUser;
      state.loaded = action.payload.loaded;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.loaded = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Login failed";
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.loaded = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Registration failed";
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.currentUser = null;
        state.loaded = true;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { setUserState, clearError } = authSlice.actions;
export default authSlice.reducer;
