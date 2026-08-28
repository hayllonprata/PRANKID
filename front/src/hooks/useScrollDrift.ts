"use client";

import { useCallback, useEffect, useRef } from "react";

type DriftNode = {
  el: HTMLElement;
  speedY: number;
  speedX: number;
  origin: "viewport" | "page";
};

const nodes = new Set<DriftNode>();
let attached = false;
let frame = 0;

function tick() {
  frame = 0;
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach(({ el }) => {
        el.style.transform = "";
      });
      return;
    }
    const view = window.innerHeight || 1;
    const mid = view / 2;
    const scrolled = window.scrollY || 0;
    nodes.forEach(({ el, speedY, speedX, origin }) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -140 || rect.top > view + 140) return;
      const delta = origin === "page" ? -scrolled : rect.top + rect.height / 2 - mid;
      const y = Math.max(-56, Math.min(56, delta * speedY));
      const x = Math.max(-20, Math.min(20, delta * speedX));
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
}

function onScroll() {
  if (frame) return;
  frame = requestAnimationFrame(tick);
}

function ensureListener() {
  if (attached) return;
  attached = true;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

function releaseListener() {
  if (nodes.size || !attached) return;
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
  attached = false;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
}

export function useScrollDrift<T extends HTMLElement = HTMLElement>(
  speedY = 0.12,
  speedX = 0,
  origin: "viewport" | "page" = "viewport",
) {
  const nodeRef = useRef<DriftNode | null>(null);

  useEffect(() => {
    if (nodeRef.current) {
      nodeRef.current.speedY = speedY;
      nodeRef.current.speedX = speedX;
      nodeRef.current.origin = origin;
    }
  }, [speedY, speedX, origin]);

  return useCallback(
    (el: T | null) => {
      if (nodeRef.current) {
        nodes.delete(nodeRef.current);
        nodeRef.current = null;
        releaseListener();
      }
      if (!el) return;
      const node: DriftNode = { el, speedY, speedX, origin };
      nodeRef.current = node;
      nodes.add(node);
      ensureListener();
      tick();
    },
    [speedY, speedX, origin],
  );
}
