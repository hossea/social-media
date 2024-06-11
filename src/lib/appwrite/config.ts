import { Client, Account, Databases, Storage, Avatars } from "appwrite";


export const appwriteConfig = {
  url: import.meta.env.VITE_APPWRITE_URL,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  storageId: import.meta.env.VITE_APPWRITE_STORAGE_ID,
  userCollectionId: import.meta.env.VITE_APPWRITE_USER_COLLECTION_ID,
  postCollectionId: import.meta.env.VITE_APPWRITE_POST_COLLECTION_ID,
  savesCollectionId: import.meta.env.VITE_APPWRITE_SAVES_COLLECTION_ID,
};


console.log('Appwrite Config:', appwriteConfig);


// Debugging logs for environment variables
console.log('VITE_APPWRITE_URL:', import.meta.env.VITE_APPWRITE_URL);
console.log('VITE_APPWRITE_PROJECT_ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID);
console.log('VITE_APPWRITE_DATABASE_ID:', import.meta.env.VITE_APPWRITE_DATABASE_ID);
console.log('VITE_APPWRITE_STORAGE_ID:', import.meta.env.VITE_APPWRITE_STORAGE_ID);
console.log('VITE_APPWRITE_USER_COLLECTION_ID:', import.meta.env.VITE_APPWRITE_USER_COLLECTION_ID);
console.log('VITE_APPWRITE_POST_COLLECTION_ID:', import.meta.env.VITE_APPWRITE_POST_COLLECTION_ID);
console.log('VITE_APPWRITE_SAVES_COLLECTION_ID:', import.meta.env.VITE_APPWRITE_SAVES_COLLECTION_ID);

// Check if required environment variables are missing
if (!appwriteConfig.url || !appwriteConfig.projectId) {
  throw new Error('Appwrite configuration is incomplete. Please ensure all required environment variables are set.');
}

export const client = new Client();
client.setEndpoint(appwriteConfig.url);
client.setProject(appwriteConfig.projectId);
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
