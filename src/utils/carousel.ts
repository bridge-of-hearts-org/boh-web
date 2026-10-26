/* Shared rules for the photo carousel on each Directory listing */

/* The smallest horizontal swipe, in pixels, that changes the photo */
export const MIN_SWIPE_DISTANCE = 40;

/* The most photos shown as dots; more are shown as an "n / N" counter, as
   the dots wouldn't fit across the photo */
export const MAX_PHOTO_DOTS = 6;

type Point = { x: number; y: number };

/* The photo index `step` places away from `index`, wrapping around both ends.
   An empty list stays at 0. */
export function stepIndex(index: number, step: number, count: number): number {
    if (count <= 0) {
        return 0;
    }

    return (((index + step) % count) + count) % count;
}

/* The step a swipe from `start` to `end` makes: 1 for a swipe to the left
   (next photo), -1 for a swipe to the right (previous photo), and 0 for a
   movement too short to count as a swipe, or a mostly vertical one, which
   is the user scrolling the page */
export function swipeStep(start: Point, end: Point): number {
    const dx = start.x - end.x;
    const dy = start.y - end.y;

    if (Math.abs(dx) < MIN_SWIPE_DISTANCE || Math.abs(dy) > Math.abs(dx)) {
        return 0;
    }

    return dx > 0 ? 1 : -1;
}

/* Whether a carousel of `count` photos shows dots rather than a counter */
export function showsPhotoDots(count: number): boolean {
    return count <= MAX_PHOTO_DOTS;
}
