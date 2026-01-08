"use client"

import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import { changePasswordSchema } from "@/lib/validations/user";
import type {z} from "zod";

type changePasswordFormType = z.infer<typeof changePasswordSchema>;

export const useChangePasswordForm = () => {
    const form = useForm<changePasswordFormType>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        },
    });

    const {handleSubmit, formState: {isSubmitting}} = form;

    return {
        form,
        handleSubmit,
        isSubmitting,
    };
}