/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useRef } from "react";
import type { DefaultValues } from "react-hook-form";
import { useForm } from "react-hook-form";
import type { z } from "zod";

export function useFormDialog<TSchema extends z.ZodTypeAny>(
    schema: TSchema,
    defaultValues?: DefaultValues<z.input<TSchema>>,
    options?: {
        mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
    },
) {
    type TData = z.infer<TSchema>;

    const form = useForm<TData & Record<string, any>>({
        ...options,
        resolver: zodResolver(schema as any),
        defaultValues: defaultValues as any,
    });

    const defaultValuesRef = useRef(defaultValues);
    defaultValuesRef.current = defaultValues;

    const resetForm = useCallback(
        (values?: DefaultValues<TData>) => {
            form.reset(values ?? (defaultValuesRef.current as any));
        },
        [form],
    );

    return {
        form,
        resetForm,
    };
}
