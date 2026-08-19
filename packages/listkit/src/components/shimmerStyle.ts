/**
 * Skeleton shimmer shared by SkeletonTable and SkeletonCards so the two
 * loading states cannot drift apart. A `<style>` string, not Tailwind: the
 * animated gradient needs a keyframes block, which is also why the
 * class-driven dark variant is spelled out by hand.
 */
export const shimmerStyle = `
  @keyframes lk-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .lk-shimmer {
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    animation: lk-shimmer 1.5s infinite linear;
  }
  .dark .lk-shimmer {
    background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%);
    background-size: 200% 100%;
  }
`
