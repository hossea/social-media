import { ID, ImageGravity, Query } from "appwrite";
import { appwriteConfig, account, databases, storage, avatars } from "./config";
import { IUpdatePost, INewPost, INewUser, IUpdateUser, PostType} from "../../types";

// ============================================================
// AUTH
// ============================================================

// ============================== SIGN UP
export async function createUserAccount(user: INewUser) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) throw new Error('Failed to create account');

    const avatarUrl = avatars.getInitials(user.name);

    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      email: newAccount.email,
      username: user.username,
      imageUrl: avatarUrl.href,
    });

    return newUser;
  } catch (error) {
    console.error('Error creating user account:', error);
    throw error;
  }
}

// ============================== SAVE USER TO DB
export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: string;
  username?: string;
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user
    );

    return newUser;
  } catch (error) {
    console.error('Error saving user to DB:', error);
    throw error;
  }
}

// ============================== SIGN IN
export async function signInAccount(user: { email: string; password: string }) {
  try {
    const session = await account.createEmailPasswordSession(user.email, user.password);
    return session;
  } catch (error) {
    console.error('Error signing in account:', error);
    throw error;
  }
}


// ============================== GET ACCOUNT
export async function getAccount() {
  try {
    const currentAccount = await account.get();
    return currentAccount;
  } catch (error) {
    console.error('Error getting account:', error);
    throw error;
  }
}

// ============================== GET USER
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();

    if (!currentAccount) throw new Error('No current account');

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw new Error('No current user');

    return currentUser.documents[0];
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
}

// ============================== SIGN OUT
export async function signOutAccount() {
  try {
    const session = await account.deleteSession("current");
    return session;
  } catch (error) {
    console.error('Error signing out account:', error);
    throw error;
  }
}

// ============================================================
// POSTS
// ============================================================

// ============================== CREATE POST
export async function createPost(post: INewPost) {
  try {
    const uploadedFile = await uploadFile(post.file[0]);
    if (!uploadedFile) throw new Error('Failed to upload file');
    const fileUrl = getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw new Error('Failed to get file preview');
    }

    const tags = post.tags?.replace(/ /g, "").split(",") || [];
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl.href,
        imageId: uploadedFile.$id,
        location: post.location,
        tags: tags,
      }
    );

    if (!newPost) {
      await deleteFile(uploadedFile.$id);
      throw new Error('Failed to create post');
    }

    return newPost;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}
// ============================== UPLOAD FILE
export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file
    );

    return uploadedFile;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
// ============================== GET FILE URL
export function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000,
      2000,
     "top" as ImageGravity,
      100
    );

    if (!fileUrl) throw new Error('Failed to get file URL');

    return fileUrl;
  } catch (error) {
    console.error('Error getting file preview:', error);
    throw error;
  }
}
// ============================== DELETE FILE
export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);
    return { status: "ok" };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}
// ============================== GET POSTS
export async function searchPosts(searchTerm: string) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.search("caption", searchTerm)]
    );

    if (!posts) throw new Error('Failed to search posts');

    return posts;
  } catch (error) {
    console.error('Error searching posts:', error);
    throw error;
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
  const queries: any[] = [Query.orderDesc("$updatedAt"), Query.limit(9)];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries
    );
    if (!posts) throw new Error('Failed to get posts');
    return posts;
  } catch (error) {
    console.error('Error getting infinite posts:', error);
    throw error;
  }
}
// ============================== GET POST BY ID
export async function getPostById(postId?: string) {
  if (!postId) throw new Error('No post ID provided');
  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );
    if (!post) throw new Error('Failed to get post by ID');

    return post;
  } catch (error) {
    console.error('Error getting post by ID:', error);
    throw error;
  }
}
// ============================== UPDATE POST
export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;
  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    };

    if (hasFileToUpdate) {
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw new Error('Failed to upload new file');

      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw new Error('Failed to get file preview');
      }
      const updateImage = async (post: PostType, fileUrl: URL) => {
        return { imageId: post.imageId, imageUrl: fileUrl, newImageId: uploadedFile.$id };
    };
    image = await updateImage(post, fileUrl);
    }

    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags,
      }
    );

    if (!updatedPost) {
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }
      throw new Error('Failed to update post');
    }

    if (hasFileToUpdate) {
      await deleteFile(post.imageId);
    }

    return updatedPost;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

// ============================== DELETE POST
export async function deletePost(postId?: string, imageId?: string) {
  if (!postId || !imageId) throw new Error('Post ID or Image ID missing');

  try {
    await databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.postCollectionId, postId);
    await deleteFile(imageId);
    return { status: "ok" };
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// ============================== LIKE / UNLIKE POST
export async function likePost(postId: string, likesArray: string[]) {
  try {
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      { likes: likesArray }
    );

    if (!updatedPost) throw new Error('Failed to like post');

    return updatedPost;
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
}

// ============================== SAVE POST
export async function savePost(userId: string, postId: string) {
  try {
    const document = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      {  userId, 
        postId,
        createdAt: new Date().toISOString(), }
    );

    if (!document) throw new Error('Failed to save post');

    return document;
  } catch (error) {
    console.error('Error saving post:', error);
    throw error;
  }
}


// ============================== DELETE SAVED POST
export async function deleteSavedPost(savedRecordId: string) {
  try {
    await databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.savesCollectionId, savedRecordId);
    return { status: "ok" };
  } catch (error) {
    console.error('Error deleting saved post:', error);
    throw error;
  }
}

// ============================== GET USER'S POST
export async function getUserPosts(userId?: string) {
  if (!userId) throw new Error('No user ID provided');

  try {
    const post = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
    );
    if (!post) throw new Error('Failed to get user posts');

    return post;
  } catch (error) {
    console.error('Error getting user posts:', error);
    throw error;
  }
}

// ============================== GET POPULAR POSTS (BY HIGHEST LIKE COUNT)
export async function getRecentPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(20)]
    );
    if (!posts) throw new Error('Failed to get recent posts');

    return posts;
  } catch (error) {
    console.error('Error getting recent posts:', error);
    throw error;
  }
}

// ============================================================
// USER
// ============================================================

// ============================== GET USERS
export async function getUsers(limit?: number) {
  const queries: any[] = [Query.orderDesc("$createdAt")];

  if (limit) {
    queries.push(Query.limit(limit));
  }

  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      queries
    );
    if (!users) throw new Error('Failed to get users');
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

// ============================== GET USER BY ID
export async function getUserById(userId: string) {
  try {
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId
    );

    if (!user) throw new Error('Failed to get user by ID');

    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}
// ============================== UPDATE USER
export async function updateUser(user: IUpdateUser) {
  const hasFileToUpdate = user.file.length > 0;
  try {
    let image = {
      imageUrl: user.imageUrl,
      imageId: user.imageId,
    };
    if (hasFileToUpdate) {
      const uploadedFile = await uploadFile(user.file[0]);
      if (!uploadedFile) throw new Error('Failed to upload new file');
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw new Error('Failed to get file preview');
      }
      image = { ...image, imageUrl: fileUrl.href, imageId: uploadedFile.$id };
    }

    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      user.userId,
      {
        name: user.name,
        bio: user.bio,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
      }
    );

    if (!updatedUser) {
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }
      throw new Error('Failed to update user');
    }
    if (user.imageId && hasFileToUpdate) {
      await deleteFile(user.imageId);
    }

    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}


