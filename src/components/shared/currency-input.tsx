import type { ChangeEvent, ComponentProps } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/format";

interface CurrencyInputProps
    extends Omit<ComponentProps<"input">, "onChange" | "value" | "type"> {
    value: number;
    onChange: (value: number) => void;
}

export function CurrencyInput({
    value,
    onChange,
    ...props
}: CurrencyInputProps) {
    const [display, setDisplay] = useState(() =>
        value > 0 ? formatCurrency(value) : "",
    );
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (document.activeElement !== ref.current) {
            setDisplay(value > 0 ? formatCurrency(value) : "");
        }
    }, [value]);

    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value.replace(/[^\d]/g, "");
            const num = raw ? Number(raw) : 0;
            setDisplay(raw ? formatCurrency(num) : "");
            onChange(num);
        },
        [onChange],
    );

    const handleFocus = useCallback(() => {
        const raw = value.toString();
        setDisplay(raw);
        ref.current?.select();
    }, [value]);

    const handleBlur = useCallback(() => {
        setDisplay(value > 0 ? formatCurrency(value) : "");
    }, [value]);

    return (
        <Input
            ref={ref}
            type="text"
            inputMode="numeric"
            value={display}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
        />
    );
}
