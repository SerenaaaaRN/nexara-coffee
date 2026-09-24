"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

interface RevealProps {
    children: ReactNode;
    delay?: number;
    y?: number;
    className?: string;
}

export const Reveal = ({
    children,
    delay = 0,
    y = 28,
    className,
}: RevealProps) => {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={reduce ? false : { opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay, ease: EASE }}>
            {children}
        </motion.div>
    );
};

interface RevealStaggerProps {
    children: ReactNode;
    className?: string;
    stagger?: number;
}

export const RevealStagger = ({
    children,
    className,
    stagger = 0.08,
}: RevealStaggerProps) => {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={reduce ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: stagger } },
            }}>
            {children}
        </motion.div>
    );
};

export const RevealItem = ({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) => {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            variants={{
                hidden: reduce ? {} : { opacity: 0, y: 26 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.65, ease: EASE },
                },
            }}>
            {children}
        </motion.div>
    );
};

interface SectionHeadingProps {
    title: string;
    body: string;
    aside?: ReactNode;
    className?: string;
}

export const SectionHeading = ({
    title,
    body,
    aside,
    className,
}: SectionHeadingProps) => {
    return (
        <Reveal
            className={
                className ??
                "mb-8 flex flex-wrap items-end justify-between gap-4"
            }>
            <div>
                <h2 className="text-3xl font-bold tracking-tighter text-balance md:text-4xl">
                    {title}
                </h2>
                <p className="mt-2 max-w-[60ch] text-muted-foreground">
                    {body}
                </p>
            </div>
            {aside ? (
                <div className="flex items-center gap-2">{aside}</div>
            ) : null}
        </Reveal>
    );
};
