import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
