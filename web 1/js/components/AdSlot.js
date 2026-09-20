/**
 * Reusable Advertisement Placement Component
 * Renders non-intrusive, responsive ad unit placeholders that are strictly compliant
 * with advertising network policies (no auto-clicks, clearly labeled, content-separated).
 */

export const AdSlot = {
  /**
   * Render an ad placeholder container
   * @param {string} slotType - 'banner' | 'leaderboard' | 'sidebar' | 'inline' | 'native'
   * @param {string} id - Unique identifier for the ad slot
   */
  render(slotType = 'inline', id = '') {
    const slotId = id || `ad-slot-${Math.random().toString(36).substr(2, 9)}`;

    let dimensions = 'min-height: 90px; width: 100%; max-width: 728px;';
    let label = 'Advertisement (728x90 Leaderboard Placeholder)';

    if (slotType === 'banner') {
      dimensions = 'min-height: 90px; width: 100%; max-width: 970px;';
      label = 'Sponsored Banner (970x90 Placeholder)';
    } else if (slotType === 'sidebar') {
      dimensions = 'min-height: 250px; width: 100%; max-width: 300px;';
      label = 'Sponsored Placement (300x250 Placeholder)';
    } else if (slotType === 'inline') {
      dimensions = 'min-height: 100px; width: 100%;';
      label = 'Sponsored Catalog Break';
    } else if (slotType === 'feed') {
      dimensions = 'min-height: 80px; width: 100%;';
      label = 'Advertisement';
    }

    return `
      <div 
        id="${slotId}" 
        class="ad-placement-slot ad-type-${slotType}" 
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 28px auto;
          ${dimensions}
          background: rgba(255, 255, 255, 0.015);
          border: 1px dashed rgba(168, 85, 247, 0.25);
          border-radius: var(--radius-md);
          padding: 16px;
          text-align: center;
          position: relative;
          user-select: none;
        "
        data-ad-slot-type="${slotType}"
        aria-label="Advertisement slot"
      >
        <div style="
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--text-dim);
          margin-bottom: 6px;
          font-weight: 600;
        ">
          SPONSORED / ADVERTISEMENT
        </div>
        <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <span>${label}</span>
        </div>
        <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 4px;">
          Space reserved for certified partner ads. No intrusive overlays or popups.
        </div>
      </div>
    `;
  }
};
