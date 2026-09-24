"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface LandingCountUpProps {
    value: number;
    duration?: number;
}

export const LandingCountUp = ({
    value,
    duration = 1.2,
}: LandingCountUpProps) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, amount: 0.6 });
    const reduce = useReducedMotion();
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (!inView) return;
        if (reduce) {
            setDisplay(value);
            return;
        }
        let frame = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - start) / (duration * 1000), 1);
            const eased = 1 - (1 - progress) ** 3;
            setDisplay(Math.round(eased * value));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [inView, value, duration, reduce]);

    return <span ref={ref}>{display}</span>;
};
