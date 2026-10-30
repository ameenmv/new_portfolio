import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BREAKPOINTS } from "../../utils/sizes";

gsap.registerPlugin(ScrollTrigger);

/**
 * Polaroid wall: project photos get tossed onto a cork board while scrolling,
 * develop like real polaroids, get pinned and linked with a red string.
 * Once pinned they hang from their pin, lean toward the cursor and can be dragged around.
 */

// resting spots in % of the board (x, y = card centre) + tilt
const SLOTS = {
  desktop: [
    [30, 33, -6],
    [55, 27, 4],
    [80, 36, -3],
    [24, 72, 5],
    [50, 70, -4],
    [77, 74, 7],
  ],
  mobile: [
    [30, 27, -5],
    [72, 33, 5],
    [28, 52, 4],
    [70, 58, -6],
    [30, 79, -3],
    [70, 84, 6],
  ],
} as const;

const TOSS_START = 0.04;
const TOSS_STEP = 0.125;
const TOSS_DURATION = 0.11;
const DRAG_THRESHOLD = 5;
const PIN_Y = 14; // pin centre from the top of a card; cards rotate around their pin

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// PERF: only touch the DOM when a value actually changes
const written = new WeakMap<Element, Record<string, string>>();
const write = (el: Element | null, key: string, value: string, apply: () => void) => {
  if (!el) return;
  let cache = written.get(el);
  if (!cache) written.set(el, (cache = {}));
  if (cache[key] === value) return;
  cache[key] = value;
  apply();
};
const setStyle = (el: HTMLElement | null, prop: string, value: string) =>
  write(el, prop, value, () => el!.style.setProperty(prop, value));
const setAttr = (el: Element | null, name: string, value: string) =>
  write(el, `@${name}`, value, () => el!.setAttribute(name, value));

type Card = {
  el: HTMLElement;
  photo: HTMLElement;
  pin: HTMLElement | null;
  develop: HTMLElement | null;
  flash: HTMLElement | null;
  glare: HTMLElement | null;
  path: SVGPathElement | null;
  shadowPath: SVGPathElement | null;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  sag: number;
  sagV: number;
  pinDrop: number;
  // hover, eased in the ticker (no CSS transitions chasing the cursor)
  hover: number;
  hoverTarget: number;
  tiltX: number;
  tiltY: number;
  tiltTargetX: number;
  tiltTargetY: number;
  rect: DOMRect | null;
  landed: boolean;
  dragging: boolean;
  suppressClick: boolean;
  cleanup: () => void;
};

type Options = {
  section: HTMLElement;
  board: HTMLElement;
  strings: SVGSVGElement;
  cards: HTMLElement[];
  onHint?: (visible: boolean) => void;
};

export const createProjectsWall = ({ section, board, strings, cards: cardEls, onHint }: Options) => {
  const state = { progress: 0 };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let active = false;
  let width = 0;
  let height = 0;
  let cardW = 0;
  let cardH = 0;
  let isMobile = false;
  let hintVisible = false;
  // stacking order: the last card you dragged stays on top
  const order: number[] = cardEls.map((_, i) => i);

  strings.replaceChildren();
  const svgPath = (className: string) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("pathLength", "1");
    path.setAttribute("class", className);
    return path;
  };

  const cards: Card[] = cardEls.map((el, i) => {
    // a soft offset copy under each string instead of a per-frame SVG filter
    const shadowPath = i > 0 ? svgPath("is-shadow") : null;
    const path = i > 0 ? svgPath("is-string") : null;
    if (shadowPath && path) strings.append(shadowPath, path);

    const photo = (el.querySelector("[data-wall-photo]") as HTMLElement) ?? el;
    const card: Card = {
      el,
      photo,
      pin: el.querySelector("[data-wall-pin]"),
      develop: el.querySelector("[data-wall-develop]"),
      flash: el.querySelector("[data-wall-flash]"),
      glare: el.querySelector("[data-wall-glare]"),
      path,
      shadowPath,
      ox: 0,
      oy: 0,
      vx: 0,
      vy: 0,
      rot: 0,
      vr: 0,
      sag: 0,
      sagV: 0,
      pinDrop: 1,
      hover: 0,
      hoverTarget: 0,
      tiltX: 0,
      tiltY: 0,
      tiltTargetX: 0,
      tiltTargetY: 0,
      rect: null,
      landed: false,
      dragging: false,
      suppressClick: false,
      cleanup: () => {},
    };

    el.style.transformOrigin = `50% ${PIN_Y}px`;

    // ─── drag (mouse / pen only, so touch keeps scrolling the page) ───
    let drag: { sx: number; sy: number; lx: number; ly: number; ox: number; oy: number; t: number; id: number } | null =
      null;

    const onDown = (e: PointerEvent) => {
      if (!card.landed || e.pointerType === "touch" || e.button !== 0) return;
      drag = { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, ox: card.ox, oy: card.oy, t: e.timeStamp, id: e.pointerId };
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !card.dragging) aim(e);
      if (!drag || e.pointerId !== drag.id) return;
      const moved = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);

      // only become a drag past the threshold, so a plain click still opens the project
      if (!card.dragging) {
        if (moved < DRAG_THRESHOLD) return;
        card.dragging = true;
        el.setPointerCapture(e.pointerId);
        el.classList.add("is-dragging");
        card.hoverTarget = 0;
      }

      const dt = Math.max(1, e.timeStamp - drag.t);
      card.vx = ((e.clientX - drag.lx) / dt) * 16;
      card.vy = ((e.clientY - drag.ly) / dt) * 16;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      drag.t = e.timeStamp;
      card.ox = drag.ox + (e.clientX - drag.sx);
      card.oy = drag.oy + (e.clientY - drag.sy);
    };

    const onUp = () => {
      if (card.dragging) {
        order.splice(order.indexOf(i), 1);
        order.push(i);
        card.dragging = false;
        card.suppressClick = true;
        card.pinDrop = 0; // pin pops back in
        el.classList.remove("is-dragging");
      }
      drag = null;
    };

    // ─── hover: the photo lifts and leans toward the cursor ───
    // PERF: the rect is read once on enter, never during pointermove
    const aim = (e: PointerEvent) => {
      const rect = card.rect;
      if (!rect) return;
      const x = clamp((e.clientX - rect.left) / rect.width);
      const y = clamp((e.clientY - rect.top) / rect.height);
      card.tiltTargetX = (0.5 - y) * 10;
      card.tiltTargetY = (x - 0.5) * 12;
    };

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !card.landed || card.dragging) return;
      card.rect = photo.getBoundingClientRect();
      card.hoverTarget = 1;
      aim(e);
    };

    const onLeave = () => {
      card.hoverTarget = 0;
      card.tiltTargetX = 0;
      card.tiltTargetY = 0;
    };

    // swallow the click that ends a drag before the link handles it
    const onClick = (e: MouseEvent) => {
      if (!card.suppressClick) return;
      card.suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    };

    const onDragStart = (e: DragEvent) => e.preventDefault();

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("click", onClick, true);
    el.addEventListener("dragstart", onDragStart);
    card.cleanup = () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("dragstart", onDragStart);
    };

    return card;
  });

  const measure = () => {
    const rect = board.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    isMobile = window.innerWidth < BREAKPOINTS.md;
    const first = cards[0]?.el;
    cardW = first?.offsetWidth ?? 0;
    cardH = first?.offsetHeight ?? 0;
  };

  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(board);
  cards.forEach((c) => resizeObserver.observe(c.el));
  measure();

  const tick = (_time: number, deltaTime: number) => {
    if (!active || !width) return;
    const dt = Math.min(deltaTime / 1000, 1 / 20);
    const p = reducedMotion ? 1 : state.progress;

    const slots = isMobile ? SLOTS.mobile : SLOTS.desktop;
    const pins: { pos: [number, number]; on: number; start: number; dragging: boolean }[] = [];

    cards.forEach((c, i) => {
      const [sx, sy, srot] = slots[i % slots.length]!;
      const start = TOSS_START + i * TOSS_STEP;
      const t = reducedMotion ? 1 : clamp((p - start) / TOSS_DURATION);
      const fly = easeOut(t);
      const side = i % 2 === 0 ? -1 : 1;

      // positions are the pin's: the card hangs from it
      let x = (sx / 100) * width + side * (1 - fly) * width * 0.55;
      let y = (sy / 100) * height - cardH / 2 + PIN_Y - (1 - fly) * height * 1.15;
      let rot = srot + side * (1 - fly) * 38;
      const slap = t < 1 ? lerp(1.55, 1, easeOutBack(t, 2.2)) : 1;
      let lift = 1 - fly;

      c.landed = t >= 1;

      if (c.landed) {
        if (!c.dragging) {
          c.vx *= Math.pow(0.02, dt);
          c.vy *= Math.pow(0.02, dt);
        }
        // swing: drag velocity while held, a damped pendulum otherwise
        const targetRot = c.dragging ? clamp(c.vx * 0.9, -18, 18) : 0;
        c.vr += (targetRot - c.rot) * 120 * dt - c.vr * 7 * dt;
        c.rot += c.vr * dt;
        if (!c.dragging && Math.abs(c.rot) < 0.01 && Math.abs(c.vr) < 0.01) c.rot = c.vr = 0;
        x += c.ox;
        y += c.oy;
        rot += c.rot;
        if (c.dragging) lift = 0.6;
      }

      const scale = slap * (c.dragging ? 1.06 : 1);
      setStyle(
        c.el,
        "transform",
        `translate3d(${(x - cardW / 2).toFixed(1)}px, ${(y - PIN_Y).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
      );
      setStyle(c.el, "z-index", String(c.dragging ? 40 : 10 + order.indexOf(i)));
      setStyle(c.el, "visibility", t > 0 ? "visible" : "hidden");

      const blur = 6 + lift * 40;
      setStyle(
        c.photo,
        "--wall-shadow",
        `${(lift * 18).toFixed(0)}px ${blur.toFixed(0)}px ${(blur * 1.6).toFixed(0)}px -6px rgba(0, 0, 0, ${(0.5 - lift * 0.2).toFixed(2)})`,
      );

      // polaroid develops after it lands, with a camera flash on impact
      const developed = reducedMotion ? 1 : smooth(start + 0.08, start + 0.2, p);
      setStyle(c.develop, "opacity", (1 - developed).toFixed(2));
      const flash = reducedMotion ? 0 : smooth(start + 0.1, start + 0.11, p) * (1 - smooth(start + 0.11, start + 0.15, p));
      setStyle(c.flash, "opacity", (flash * 0.75).toFixed(2));

      // pin drops in right after the slap and pops out while dragging
      const pinIn = c.dragging ? 0 : reducedMotion ? 1 : smooth(start + 0.095, start + 0.115, p);
      c.pinDrop = Math.min(1, c.pinDrop + dt * 4);
      const pinT = pinIn * easeOutBack(c.pinDrop, 3);
      setStyle(c.pin, "transform", `translateY(${((1 - pinT) * -36).toFixed(1)}px) scale(${(1 + (1 - pinT) * 0.8).toFixed(2)})`);
      setStyle(c.pin, "opacity", pinT > 0.02 ? "1" : "0");

      // hover: fast, frame-rate independent easing toward the cursor
      const ease = 1 - Math.exp(-dt * 16);
      c.hover += (c.hoverTarget - c.hover) * ease;
      c.tiltX += (c.tiltTargetX - c.tiltX) * ease;
      c.tiltY += (c.tiltTargetY - c.tiltY) * ease;
      if (Math.abs(c.hover - c.hoverTarget) < 0.001) c.hover = c.hoverTarget;
      const h = c.hover;
      setStyle(
        c.photo,
        "transform",
        h || c.tiltX || c.tiltY
          ? `perspective(900px) translate3d(0, ${(-6 * h).toFixed(2)}px, 0) scale(${(1 + 0.04 * h).toFixed(4)}) rotateX(${(c.tiltX * h).toFixed(2)}deg) rotateY(${(c.tiltY * h).toFixed(2)}deg)`
          : "none",
      );
      setStyle(c.glare, "opacity", h.toFixed(3));
      setStyle(c.glare, "transform", `translate3d(${(c.tiltY * 4).toFixed(1)}%, ${(-c.tiltX * 5).toFixed(1)}%, 0)`);

      pins.push({ pos: [x, y], on: pinIn, start, dragging: c.dragging });
    });

    // red string between consecutive pins, sagging and swinging
    cards.forEach((c, i) => {
      if (!c.path || !c.shadowPath) return;
      const a = pins[i - 1]!;
      const b = pins[i]!;
      const draw = reducedMotion ? 1 : smooth(b.start + 0.105, b.start + 0.13, p) * a.on;
      const [x1, y1] = a.pos;
      const [x2, y2] = b.pos;
      const targetSag = Math.hypot(x2 - x1, y2 - y1) * 0.16;
      c.sagV += (targetSag - c.sag) * 90 * dt - c.sagV * 6 * dt;
      c.sag += c.sagV * dt;
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2 + c.sag;
      const d = `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
      const offset = (1 - draw).toFixed(3);
      const opacity = draw <= 0.001 ? "0" : a.dragging || b.dragging ? "0.4" : "1";
      for (const path of [c.path, c.shadowPath]) {
        setAttr(path, "d", d);
        setStyle(path as unknown as HTMLElement, "stroke-dashoffset", offset);
        setStyle(path as unknown as HTMLElement, "opacity", opacity);
      }
    });

    const showHint = p > 0.8;
    if (showHint !== hintVisible) {
      hintVisible = showHint;
      onHint?.(showHint);
    }
  };

  const visibility = ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      active = self.isActive;
      if (active) measure();
    },
  });

  const tween = gsap.fromTo(
    state,
    { progress: 0 },
    {
      progress: 1,
      ease: "none",
      scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 1 },
    },
  );

  active = visibility.isActive;
  gsap.ticker.add(tick);

  const destroy = () => {
    gsap.ticker.remove(tick);
    resizeObserver.disconnect();
    visibility.kill();
    tween.scrollTrigger?.kill();
    tween.kill();
    cards.forEach((c) => c.cleanup());
    strings.replaceChildren();
  };

  return { destroy };
};
