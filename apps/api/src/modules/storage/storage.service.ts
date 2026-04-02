import { LocalStorageProvider } from "./providers/local.provider";
import type { IStorageProvider } from "./storage.interface";

export const getStorageProvider = (): IStorageProvider => {
    return new LocalStorageProvider();
};