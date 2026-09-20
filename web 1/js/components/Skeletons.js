/**
 * Skeleton Loading States
 */

export const Skeletons = {
  /**
   * Render a grid of anime card skeletons
   */
  renderCardSkeletonGrid(count = 12) {
    return Array.from({ length: count }).map(() => `
      <div class="card-skeleton">
        <div class="card-skeleton-poster skeleton"></div>
        <div class="card-skeleton-content">
          <div class="card-skeleton-line skeleton"></div>
          <div class="card-skeleton-line short skeleton"></div>
        </div>
      </div>
    `).join('');
  },

  /**
   * Render Hero Section skeleton
   */
  renderHeroSkeleton() {
    return `
      <div class="hero-section" style="background: #121622;">
        <div class="hero-container" style="width: 100%;">
          <div class="skeleton" style="width: 120px; height: 24px; border-radius: 999px; margin-bottom: 16px;"></div>
          <div class="skeleton" style="width: 60%; height: 48px; border-radius: 8px; margin-bottom: 16px;"></div>
          <div class="skeleton" style="width: 85%; height: 20px; border-radius: 6px; margin-bottom: 8px;"></div>
          <div class="skeleton" style="width: 70%; height: 20px; border-radius: 6px; margin-bottom: 24px;"></div>
          <div style="display: flex; gap: 12px;">
            <div class="skeleton" style="width: 140px; height: 44px; border-radius: 999px;"></div>
            <div class="skeleton" style="width: 140px; height: 44px; border-radius: 999px;"></div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render Anime Details View skeleton
   */
  renderDetailsSkeleton() {
    return `
      <div class="container" style="padding-top: 20px;">
        <div class="skeleton" style="width: 100%; height: 360px; border-radius: 20px; margin-bottom: 30px;"></div>
        <div style="display: flex; gap: 24px; margin-bottom: 30px;">
          <div class="skeleton" style="width: 220px; height: 320px; border-radius: 16px; flex-shrink: 0;"></div>
          <div style="flex: 1;">
            <div class="skeleton" style="width: 50%; height: 40px; margin-bottom: 16px;"></div>
            <div class="skeleton" style="width: 30%; height: 24px; margin-bottom: 20px;"></div>
            <div class="skeleton" style="width: 100%; height: 120px; border-radius: 12px;"></div>
          </div>
        </div>
      </div>
    `;
  }
};
