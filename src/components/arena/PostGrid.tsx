// src/components/arena/PostGrid.tsx
// Instagram-style 3-column grid for posts

import { useNavigate } from "react-router-dom";
import { Play, Dumbbell, Heart } from "lucide-react";
import { Post } from "@/lib/arena/types";

interface PostGridProps {
  posts: Post[];
  onPostClick?: (postId: string) => void;
}

const PostGrid = ({ posts, onPostClick }: PostGridProps) => {
  const navigate = useNavigate();

  const handleClick = (postId: string) => {
    if (onPostClick) {
      onPostClick(postId);
    } else {
      navigate(`/arena/post/${postId}`);
    }
  };

  const getPreviewImage = (post: Post): string | null => {
    // Check for media array first
    if (post.media && post.media.length > 0) {
      return post.media[0].url;
    }
    // Fallback to photoURL
    if (post.photoURL) {
      return post.photoURL;
    }
    return null;
  };

  const isVideoPost = (post: Post): boolean => {
    // Check if any media item is a video (type field could be extended in future)
    return post.media?.some(m => (m as any).type === 'video') || false;
  };

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => {
        const previewImage = getPreviewImage(post);
        const hasWorkout = !!post.workoutSnapshot;
        const isVideo = isVideoPost(post);

        return (
          <div
            key={post.id}
            onClick={() => handleClick(post.id)}
            className="aspect-square relative cursor-pointer group overflow-hidden bg-secondary"
          >
            {/* Preview Image */}
            {previewImage ? (
              <img
                src={previewImage}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : hasWorkout ? (
              // Workout placeholder
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <Dumbbell className="w-8 h-8 text-primary/60" />
              </div>
            ) : (
              // Generic placeholder
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <div className="w-8 h-8 rounded-full bg-muted" />
              </div>
            )}

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <span className="flex items-center gap-1 text-white text-sm font-medium">
                <Heart className="w-4 h-4 fill-white" />
                {post.kudosCount || 0}
              </span>
            </div>

            {/* Type indicators */}
            {isVideo && (
              <div className="absolute top-2 right-2">
                <Play className="w-4 h-4 text-white drop-shadow-lg" />
              </div>
            )}
            
            {/* Multiple media indicator */}
            {post.media && post.media.length > 1 && (
              <div className="absolute top-2 right-2">
                <svg className="w-4 h-4 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2V7h-4v2h2z"/>
                </svg>
              </div>
            )}

            {/* Workout badge */}
            {hasWorkout && !previewImage && (
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-medium truncate text-center drop-shadow-lg">
                  {post.workoutSnapshot?.workoutTitle}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PostGrid;
