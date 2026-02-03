"use client";

import { useEffect, useRef } from "react";

/**
 * Idle timeout hook that monitors user activity and triggers logout after inactivity.
 * 
 * Monitors the following user interactions:
 * - Mouse movement (mousemove)
 * - Mouse clicks (click)
 * - Keyboard input (keydown)
 * - Page scrolling (scroll)
 * - Touch input (touchstart)
 * 
 * Security rationale:
 * - Prevents unauthorized access if user leaves session unattended
 * - Complements cookie expiration with activity-based timeout
 * - Reduces risk of session hijacking on shared devices
 * 
 * @param onTimeout - Callback function to execute when timeout is reached
 * @param timeoutMs - Timeout duration in milliseconds (default: 4 hours)
 * 
 * @example
 * ```tsx
 * import { useIdleTimeout } from "@/hooks/useIdleTimeout";
 * import { useAuth } from "@/hooks/useAuth";
 * 
 * function ProtectedLayout() {
 *   const { logout } = useAuth();
 *   
 *   useIdleTimeout(() => {
 *     logout();
 *   }, 4 * 60 * 60 * 1000); // 4 hours
 *   
 *   return <div>Protected content</div>;
 * }
 * ```
 */
export function useIdleTimeout(
    onTimeout: () => void,
    timeoutMs: number = 4 * 60 * 60 * 1000, // 4 hours default
) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        /**
         * Resets the idle timer when user activity is detected.
         * Clears existing timeout and starts a new countdown.
         */
        const resetTimer = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                onTimeout();
            }, timeoutMs);
        };

        // Activity events to monitor
        const events = ["mousemove", "click", "keydown", "scroll", "touchstart"];

        // Initialize timer on mount
        resetTimer();

        // Add event listeners for all activity types
        for (const event of events) {
            window.addEventListener(event, resetTimer);
        }

        // Cleanup: remove listeners and clear timeout
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            for (const event of events) {
                window.removeEventListener(event, resetTimer);
            }
        };
    }, [onTimeout, timeoutMs]);
}
