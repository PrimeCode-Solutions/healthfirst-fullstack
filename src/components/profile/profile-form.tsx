"use client"

import React from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {User as UserIcon, Lock} from "lucide-react";
import {UpdateUserForm} from "@/presentation/user/Update/UpdateUserForm";
import { ChangePasswordForm } from "@/presentation/user/Update/ChangePasswordForm";
import { User } from "@/modules/user/domain/user.interface";
import {toast} from "sonner";

interface ProfileFormProps{
    user: User;
    onRefetch?: () => void;
}

export function ProfileForm({user, onRefetch}: ProfileFormProps){
    const handleProfileSuccess = () => {
        toast.success("Perfil atualizado com sucesso!");
        onRefetch?.();
    };
    const handlePasswordSuccess = () =>{
        onRefetch?.();
    };

    return(
        <div className="sapce-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                            Dados pessoasis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <UpdateUserForm user={user} onSuccess={handleProfileSuccess} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Alterar senha
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ChangePasswordForm onSuccess={handlePasswordSuccess} />
                </CardContent>
            </Card>           
        </div>
    )
}