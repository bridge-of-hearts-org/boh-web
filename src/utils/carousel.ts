/* Shared rules for the photo carousel on each Directory listing */

/* The smallest horizontal swipe, in pixels, that changes the photo */
export const MIN_SWIPE_DISTANCE = 40;

/* The photo index `step` places away from `index`, wrapping around both ends.
   An empty list stays at 0. */
export function stepIndex(index: number, step: number, count: number): number {
    if (count <= 0) {
        return 0;
    }

    return (((index + step) % count) + count) % count;
}

/* The step a horizontal swipe from `startX` to `endX` makes: 1 for a swipe to
   the left (next photo), -1 for a swipe to the right (previous photo), and 0
   for a movement too short to count as a swipe */
export function swipeStep(startX: number, endX: number): number {
    const distance = startX - endX;

    if (Math.abs(distance) < MIN_SWIPE_DISTANCE) {
        return 0;
    }

    return distance > 0 ? 1 : -1;
}
