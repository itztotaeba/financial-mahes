"use client";

/**
 * Memicu drawer sidebar mobile dari halaman mana pun.
 * AppShell mendengarkan event global "mahes:open-menu".
 */
export const openMobileMenu = () =>
  window.dispatchEvent(new Event("mahes:open-menu"));
