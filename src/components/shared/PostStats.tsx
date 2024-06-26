import { Models } from "appwrite";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { checkIsLiked } from "../../lib/utils";
import {
  useLikePost,
  useSavePost,
  useDeleteSavedPost,
  useGetCurrentUser,
} from "../../lib/react-query/queries";
import { Loader } from "lucide-react";

type PostStatsProps = {
  post: Models.Document;
  userId: string;
};

const PostStats = ({ post, userId }: PostStatsProps) => {
  const location = useLocation();
  const likesList = post.likes.map((user: Models.Document) => user.$id);

  const [likes, setLikes] = useState<string[]>(likesList);
  const [isSaved, setIsSaved] = useState(false);

  const { mutate: likePost } = useLikePost();
  const { mutate: savePost, isPending: isSavingPost } = useSavePost();
  const { mutate: deleteSavePost, isPending: isDeletingSaved } = useDeleteSavedPost();
  const { data: currentUser } = useGetCurrentUser();

  useEffect(() => {
    if (currentUser) {
      const savedPostRecord = currentUser.save.find(
        (record: Models.Document) => record.post.$id === post.$id
      );
      setIsSaved(!!savedPostRecord);
    }
  }, [currentUser, post.$id]);

  const handleLikePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    e.stopPropagation();

    let likesArray = [...likes];

    const updatedLikes = likes.includes(userId)
      ? likesArray=likesArray.filter((id) => id !== userId)
    
      : [...likes, userId];
    setLikes(updatedLikes);
    likePost({ postId: post.$id, likesArray: updatedLikes });
  };

  const handleSavePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    e.stopPropagation();

    if (isSaved && currentUser) {
      const savedPostRecord = currentUser.save.find(
        (record: Models.Document) => record.post.$id === post.$id
      );
      if (savedPostRecord) {
        deleteSavePost(savedPostRecord.$id);
      }
      setIsSaved(false);
    } else {
      savePost({ userId, postId: post.$id });
      setIsSaved(true);
    }
  };
  const containerStyles = location.pathname.startsWith("/profile")
    ? "w-full"
    : "";

  return (
    <div
      className={`flex justify-between items-center z-20 ${containerStyles}`}>
      <div className="flex gap-2 mr-5">
        {isSavingPost || isDeletingSaved ? <Loader />  
         : (
          <img
            src={checkIsLiked(likes, userId) ? "/assets/icons/liked.svg" : "/assets/icons/like.svg"}
            alt="like"
            width={20}
            height={20}
            onClick={handleLikePost}
            className="cursor-pointer"
          />
        )}
        <p className="small-medium lg:base-medium">{likes.length}</p>
      </div>
      <div className="flex gap-2">
        <img
          src={isSaved ? "/assets/icons/saved.svg":"/assets/icons/save.svg"}
          alt="save" width={20} height={20}
          className="cursor-pointer" onClick={handleSavePost}
        />
      </div>
    </div>
  );
};
export default PostStats;
