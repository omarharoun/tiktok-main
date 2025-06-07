import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
  container: {
    flex: 1 / 3,
    height: 200,
    backgroundColor: "gray",
    position: "relative",
  },
  image: {
    flex: 1,
  },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "red",
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default styles;
