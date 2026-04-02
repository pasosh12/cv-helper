import { useContext } from "react";
import { StoreContext } from "@/app/store/StoreProvider";

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === null) {
    throw new Error("Maybe you did not create a store context provider");
  }

  return context;
};
