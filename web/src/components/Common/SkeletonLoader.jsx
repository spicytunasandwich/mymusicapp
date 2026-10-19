import React from 'react';

/**
 * Base shimmer element
 */
export const Skeleton = ({ className = '', rounded = 'rounded-md', style = {} }) => {
  return (
    <div
      className={`bg-audira-card/80 shimmer-bg ${rounded} ${className}`}
      style={style}
    />
  );
};

/**
 * Card skeleton (Spotify album/playlist grid cards)
 */
export const CardSkeleton = ({ count = 1 }) => {
  const items = Array.from({ length: count });
  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className="p-3.5 rounded-xl bg-audira-card/50 border border-white/5 space-y-3"
        >
          {/* Cover Art */}
          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-audira-surface/80 shimmer-bg" />
          
          {/* Title */}
          <div className="space-y-2 pt-1">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded opacity-60" />
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * Quick Play card skeleton (Spotify 2-column header cards)
 */
export const QuickPlaySkeleton = ({ count = 6 }) => {
  const items = Array.from({ length: count });
  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className="h-16 flex items-center rounded-lg bg-audira-card/40 border border-white/5 overflow-hidden"
        >
          <div className="w-16 h-16 shrink-0 bg-audira-surface/90 shimmer-bg" />
          <div className="px-3.5 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/5 rounded" />
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * Track Row skeleton (Table/list view of tracks)
 */
export const TrackRowSkeleton = ({ count = 5 }) => {
  const items = Array.from({ length: count });
  return (
    <div className="space-y-1.5 w-full">
      {items.map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-lg bg-audira-card/30 border border-white/5"
        >
          {/* Index / status */}
          <Skeleton className="w-4 h-4 rounded-full opacity-40 shrink-0" />
          
          {/* Track cover */}
          <Skeleton className="w-10 h-10 rounded-md shrink-0" />
          
          {/* Title and artist */}
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-48 rounded" />
            <Skeleton className="h-2.5 w-28 rounded opacity-60" />
          </div>

          {/* Album (hidden on mobile) */}
          <div className="hidden md:block w-36">
            <Skeleton className="h-3 w-24 rounded opacity-50" />
          </div>

          {/* Duration */}
          <Skeleton className="w-10 h-3 rounded opacity-40 shrink-0" />
        </div>
      ))}
    </div>
  );
};

/**
 * Discord-style Profile Header Skeleton
 */
export const ProfileHeaderSkeleton = () => {
  return (
    <div className="rounded-2xl overflow-hidden bg-audira-card/40 border border-white/5">
      {/* Banner Skeleton */}
      <div className="aspect-[8/3] w-full bg-audira-surface/80 shimmer-bg" />

      {/* Profile Bar */}
      <div className="p-6 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-20 sm:-mt-16 mb-4">
          {/* Avatar Skeleton */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-audira-bg bg-audira-card shrink-0 shimmer-bg" />
          
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <Skeleton className="h-7 w-48 mx-auto sm:mx-0 rounded-lg" />
            <Skeleton className="h-4 w-32 mx-auto sm:mx-0 rounded opacity-60" />
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>

        {/* Bio / Details */}
        <div className="pt-4 space-y-2 border-t border-white/5">
          <Skeleton className="h-3.5 w-full max-w-md rounded" />
          <Skeleton className="h-3.5 w-3/4 max-w-sm rounded opacity-70" />
        </div>
      </div>
    </div>
  );
};

export default {
  Skeleton,
  CardSkeleton,
  QuickPlaySkeleton,
  TrackRowSkeleton,
  ProfileHeaderSkeleton,
};
