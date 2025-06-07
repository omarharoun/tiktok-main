import { configureStore, Action, ThunkDispatch } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import authSlicePB from "./slices/authSlicePB";
import postSlicePB from "./slices/postSlicePB";
import modalSlice from "./slices/modalSlice";
import chatSlicePB from "./slices/chatSlicePB";

export const store = configureStore({
  reducer: {
    auth: authSlicePB,
    post: postSlicePB,
    modal: modalSlice,
    chat: chatSlicePB,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type AppDispatch = ThunkDispatch<RootState, null, Action<string>>;
export type RootState = ReturnType<typeof store.getState>;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
