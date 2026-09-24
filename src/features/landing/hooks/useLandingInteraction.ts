import {
    useInView,
    useReducedMotion,
    useScroll,
    useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { LANDING_HERO_SLIDES } from "@/features/landing/data";
import type { PublicMenuItem } from "@/features/landing/types";

const SLIDE_INTERVAL_MS = 5000;

/**
 * Logika slideshow hero: index slide, rotasi interval, preload, dan parallax.
 */
export const useSlideshow = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const reduce = useReducedMotion();
    const [slide, setSlide] = useState(0);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"],
    });
    const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
    const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

    useEffect(() => {
        LANDING_HERO_SLIDES.forEach((item) => {
            const img = new Image();
            img.src = item.src;
        });
    }, []);

    useEffect(() => {
        if (reduce) return;
        const id = setInterval(() => {
            setSlide((s) => (s + 1) % LANDING_HERO_SLIDES.length);
        }, SLIDE_INTERVAL_MS);
        return () => clearInterval(id);
    }, [reduce]);

    return { sectionRef, slide, setSlide, imageY, contentOpacity };
};

/**
 * Angka yang menghitung naik saat masuk viewport. Mengembalikan ref sentinel
 * untuk dipasang di elemen angka beserta nilai tampilannya.
 */
export const useCountUp = (value: number, duration = 1.2) => {
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
            setDisplay(Math.round((1 - (1 - progress) ** 3) * value));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [inView, value, duration, reduce]);

    return { countRef: ref, display };
};

/**
 * Logika carousel dua arah (index + arah gerak untuk AnimatePresence).
 */
export const useCarousel = (total: number) => {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(1);

    const go = (dir: number) => {
        if (total === 0) return;
        setDirection(dir);
        setIndex((i) => (i + dir + total) % total);
    };

    return { index: total === 0 ? 0 : index % total, direction, go };
};

/**
 * Filter kategori menu: daftar kategori, item tampil (max 7), dan state aktif.
 */
export const useMenuFilter = (items: PublicMenuItem[]) => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const categories = [...new Set(items.map((item) => item.category.name))];
    const visible = (
        activeCategory
            ? items.filter((item) => item.category.name === activeCategory)
            : items
    ).slice(0, 7);

    return { activeCategory, setActiveCategory, categories, visible };
};
