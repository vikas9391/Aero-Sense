import { useEffect, useRef, useState } from 'react';

// No "use client" directive — this project is Vite + react-router (not
// Next.js), so that directive doesn't apply here; omitted rather than
// carried over from wherever the SVG/spec originated.

const SIZE = 24; // matches the supplied SVG's own 24x24 viewBox
const TRAIL_LENGTH = 5;
const POSITION_LERP = 0.15; // base "chase" smoothing factor per frame
const POSITION_LERP_HOVER = 0.26; // tighter tracking while hovering an interactive element
const ROTATION_LERP = 0.22;
const SCALE_DEFAULT = 1;
const SCALE_HOVER = 1.2;
const SCALE_LERP = 0.2;
const MIN_SPEED_TO_ROTATE = 0.4; // px/frame — below this, keep last heading instead of jittering
// Eyeball-and-adjust, same caveat as the earlier airplane icon: this SVG's
// default heading isn't something I can confirm without a live render.
// The path reads as a dart/send-style icon pointing up-and-right, so 45 is
// a starting offset so "pointing where it's moving" lines up with travel
// direction — nudge this if the nose looks off once it's actually on screen.
const ROTATION_OFFSET_DEG = 45;

const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, [role="button"], [data-cursor-hover]';

// Shortest angular path between two headings, so the rotation lerp never
// visibly spins the long way around the 359deg -> 0deg wraparound.
function shortestAngleLerp(from: number, to: number, t: number) {
  let delta = ((to - from + 180) % 360 + 360) % 360 - 180;
  return from + delta * t;
}

export function AircraftCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mount gate: fine-pointer devices only, and only when the user hasn't
  // asked for reduced motion. Checked once on mount, not per-frame — this
  // is the only React state in the component, and it only ever changes
  // once (never touched again once the cursor is actually running).
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnabled(hasFinePointer && !reducedMotion);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;

    // Everything below lives in refs / plain mutable objects, not React
    // state — pointermove firing 60-120x/sec must never trigger a
    // re-render. Trail position objects are created once here and mutated
    // in place every frame (no push/shift, no new objects) to avoid
    // allocating inside the animation loop.
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { x: target.x, y: target.y };
    const prevPos = { x: target.x, y: target.y };
    const trail = Array.from({ length: TRAIL_LENGTH }, () => ({ x: target.x, y: target.y }));
    let angle = 0;
    let scale = SCALE_DEFAULT;
    let hovered = false;
    let rafId: number;

    const handlePointerMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };

    // Event delegation — one listener each, not one per interactive
    // element. `over`/`out` (not enter/leave) so a single listener on the
    // root/document can rely on bubbling.
    const handlePointerOver = (e: PointerEvent) => {
      if ((e.target as Element)?.closest?.(INTERACTIVE_SELECTOR)) hovered = true;
    };
    const handlePointerOut = (e: PointerEvent) => {
      const related = e.relatedTarget as Element | null;
      if (!related || !related.closest?.(INTERACTIVE_SELECTOR)) hovered = false;
    };

    const tick = () => {
      const lerpFactor = hovered ? POSITION_LERP_HOVER : POSITION_LERP;
      prevPos.x = pos.x;
      prevPos.y = pos.y;
      pos.x += (target.x - pos.x) * lerpFactor;
      pos.y += (target.y - pos.y) * lerpFactor;

      const dx = pos.x - prevPos.x;
      const dy = pos.y - prevPos.y;
      const speed = Math.hypot(dx, dy);
      if (speed > MIN_SPEED_TO_ROTATE) {
        const targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + ROTATION_OFFSET_DEG;
        angle = shortestAngleLerp(angle, targetAngle, ROTATION_LERP);
      }

      const targetScale = hovered ? SCALE_HOVER : SCALE_DEFAULT;
      scale += (targetScale - scale) * SCALE_LERP;

      if (root) {
        root.style.transform =
          `translate3d(${pos.x - SIZE / 2}px, ${pos.y - SIZE / 2}px, 0) ` +
          `rotate(${angle}deg) scale(${scale})`;
      }

      // Trail: shift each dot toward the one ahead of it, oldest last —
      // reuses the same TRAIL_LENGTH objects every frame, no allocation.
      for (let i = TRAIL_LENGTH - 1; i > 0; i--) {
        trail[i].x = trail[i - 1].x;
        trail[i].y = trail[i - 1].y;
      }
      trail[0].x = pos.x;
      trail[0].y = pos.y;
      // Stretch factor along the direction of travel — same `speed` and
      // `angle` already computed above for the aircraft's own rotation,
      // reused here rather than recomputed. Capped so it reads as a
      // glint/streak, not an elastic smear at high cursor speed.
      const stretch = Math.min(1 + speed * 0.06, 2.6);
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const dot = trailRefs.current[i];
        if (!dot) continue;
        const t = trail[i];
        const fade = 1 - i / TRAIL_LENGTH; // 1 -> 0, oldest dot fades to nothing
        const dotStretch = 1 + (stretch - 1) * fade; // only the freshest dots stretch; the tail end stays round
        dot.style.transform =
          `translate3d(${t.x - 2.5}px, ${t.y - 2.5}px, 0) rotate(${angle - ROTATION_OFFSET_DEG}deg) scaleX(${dotStretch})`;
        // Opacity capped as before ("VERY subtle"); the glow radius is
        // separate from opacity and scales with fade too, so the shine
        // reads mainly on the one or two freshest dots right behind the
        // aircraft rather than smearing evenly across the whole trail.
        dot.style.opacity = String(fade * 0.55);
        dot.style.boxShadow = `0 0 ${(3 + fade * 7).toFixed(1)}px rgba(255,255,255,${(fade * 0.85).toFixed(2)})`;
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerover', handlePointerOver, { passive: true });
    window.addEventListener('pointerout', handlePointerOut, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerover', handlePointerOver);
      window.removeEventListener('pointerout', handlePointerOut);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Trail dots — behind the aircraft (lower in the DOM = painted
          first here since both are position:fixed with the same
          z-index-adjacent stacking, but z-index is set explicitly below
          anyway so paint order doesn't actually matter). Kept to a handful
          of small fixed nodes rather than a growing/allocating list. */}
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { trailRefs.current[i] = el; }}
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'currentColor',
            color: '#fff',
            mixBlendMode: 'difference',
            pointerEvents: 'none',
            zIndex: 2147483646,
            opacity: 0,
            willChange: 'transform, opacity, box-shadow',
          }}
        />
      ))}

      <div
        ref={rootRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: SIZE,
          height: SIZE,
          // Native cursor is intentionally left alone everywhere — this
          // is drawn as an addition on top of it, not a replacement, per
          // "do not hide the native cursor globally". No `cursor: none`
          // anywhere in this component or its mount point.
          pointerEvents: 'none',
          zIndex: 2147483647,
          color: '#fff',
          // Adaptive stroke color without any background-sampling JS:
          // white + mix-blend-mode: difference automatically inverts to
          // read as near-black on light backgrounds and white on dark
          // ones, satisfying "thin white/near-black depending on
          // background" for free.
          mixBlendMode: 'difference',
          willChange: 'transform',
        }}
      >
        <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M17.7448 2.81298C18.7095 1.8165 20.3036 1.80361 21.2843 2.78436C22.2382 3.73823 22.2559 5.27921 21.3243 6.25481L18.5456 9.16457C18.3278 9.39265 18.219 9.50668 18.1518 9.64024C18.0924 9.75847 18.0571 9.88732 18.0478 10.0193C18.0374 10.1684 18.0728 10.3221 18.1438 10.6293L19.8717 18.1169C19.9444 18.4323 19.9808 18.59 19.9691 18.7426C19.9587 18.8776 19.921 19.0091 19.8582 19.1291C19.7873 19.2647 19.6729 19.3792 19.444 19.608L19.0732 19.9788C18.4671 20.585 18.164 20.888 17.8538 20.9429C17.583 20.9908 17.3043 20.925 17.0835 20.761C16.8306 20.5733 16.695 20.1666 16.424 19.3534L14.4142 13.3241L11.0689 16.6695C10.8692 16.8691 10.7694 16.969 10.7026 17.0866C10.6434 17.1907 10.6034 17.3047 10.5846 17.423C10.5633 17.5565 10.5789 17.6968 10.61 17.9775L10.7937 19.6309C10.8249 19.9116 10.8405 20.0519 10.8192 20.1854C10.8004 20.3037 10.7604 20.4177 10.7012 20.5219C10.6344 20.6394 10.5346 20.7393 10.3349 20.939L10.1374 21.1365C9.66434 21.6095 9.42781 21.8461 9.16496 21.9146C8.93442 21.9746 8.68999 21.9504 8.47571 21.8463C8.2314 21.7276 8.04585 21.4493 7.67475 20.8926L6.10643 18.5401C6.04013 18.4407 6.00698 18.391 5.96849 18.3459C5.9343 18.3058 5.89701 18.2685 5.85694 18.2343C5.81184 18.1958 5.76212 18.1627 5.66267 18.0964L3.31018 16.5281C2.75354 16.157 2.47521 15.9714 2.35649 15.7271C2.25236 15.5128 2.22816 15.2684 2.28824 15.0378C2.35674 14.775 2.59327 14.5385 3.06633 14.0654L3.26384 13.8679C3.46352 13.6682 3.56337 13.5684 3.68095 13.5016C3.78511 13.4424 3.89906 13.4024 4.01736 13.3836C4.15089 13.3623 4.29123 13.3779 4.5719 13.4091L6.22529 13.5928C6.50596 13.6239 6.6463 13.6395 6.77983 13.6182C6.89813 13.5994 7.01208 13.5594 7.11624 13.5002C7.23382 13.4334 7.33366 13.3336 7.53335 13.1339L10.8787 9.7886L4.84939 7.77884C4.03616 7.50776 3.62955 7.37222 3.44176 7.11932C3.27777 6.89848 3.212 6.61984 3.2599 6.34898C3.31477 6.03879 3.61784 5.73572 4.22399 5.12957L4.59476 4.7588C4.82365 4.52991 4.9381 4.41546 5.07369 4.34457C5.1937 4.28183 5.3252 4.24411 5.46023 4.23371C5.61278 4.22197 5.77049 4.25836 6.0859 4.33115L13.545 6.05249C13.855 6.12401 14.01 6.15978 14.1596 6.14914C14.3041 6.13886 14.4446 6.09733 14.5714 6.02742C14.7028 5.95501 14.8134 5.84074 15.0347 5.6122L17.7448 2.81298Z"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
}

export default AircraftCursor;