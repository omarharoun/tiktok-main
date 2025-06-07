import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  toggleContainer: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 1,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "rgba(82, 82, 82, 0.5)",
  },
  selectedButton: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  toggleButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
