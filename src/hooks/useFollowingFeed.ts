// src/hooks/useFollowingFeed.ts
// Hook to get posts from users I follow

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFollowing } from '@/lib/arena/followRepo';
import { Post } from '@/lib/arena/types';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';

interface UseFollowingFeedResult {
  posts: Post[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useFollowingFeed(limitCount: number = 20): UseFollowingFeedResult {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get list of users I'm following
      const followingList = await getFollowing(user.uid);
      
      if (followingList.length === 0) {
        setPosts([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Firestore 'in' query limited to 30 items
      // Split into chunks if needed
      const chunks: string[][] = [];
      for (let i = 0; i < followingList.length; i += 30) {
        chunks.push(followingList.slice(i, i + 30));
      }

      const allPosts: Post[] = [];

      for (const chunk of chunks) {
        const postsRef = collection(db, 'posts');
        const q = query(
          postsRef,
          where('authorId', 'in', chunk),
          where('visibility', '==', 'public'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {
          const data = doc.data();
          allPosts.push({
            id: doc.id,
            author: {
              userId: data.authorId,
              displayName: data.authorName,
              username: data.authorUsername,
              photoURL: data.authorAvatar,
              avatarId: data.authorAvatarId,
              elo: data.authorElo,
            },
            type: data.type || 'workout',
            visibility: data.visibility,
            postToClan: data.postToClan,
            clanId: data.clanId || undefined,
            text: data.text || data.description,
            description: data.description,
            media: data.media,
            photoURL: data.photoURL,
            workoutSnapshot: data.workoutSnapshot,
            kudosCount: data.kudosCount || 0,
            commentsCount: data.commentsCount || 0,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        });
      }

      // Sort all posts by date and limit
      allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const limitedPosts = allPosts.slice(0, limitCount);

      setPosts(limitedPosts);
      setHasMore(allPosts.length > limitCount);
    } catch (err) {
      console.error('Error loading following feed:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, limitCount]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const loadMore = useCallback(async () => {
    // For now, just refresh - pagination can be added later
    await loadFeed();
  }, [loadFeed]);

  return {
    posts,
    loading,
    error,
    refresh: loadFeed,
    hasMore,
    loadMore,
  };
}
