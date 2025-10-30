import { useCallback } from "react";
import { createBusinessHoursRepository } from "../infrastructure/businessHoursRepository";
import type { UpdateBusinessHoursDTO, BusinessHours } from "../domain/businessHours.interface";

const businessHoursRepository = createBusinessHoursRepository();

//Tipagem para os campos dos dias da semana do DTO
type DaysOfWeekField =
| "mondayEnabled"
| "tuesdayEnabled"
| "wednesdayEnablad"
| "thursdayEnabled"
| "fridayEnabled"
| "saturdayEnabled"
| "sundayEnabled";

//hook principal
export function useBusinessHoursMutations(){
    const updateBusinessHours = useCallback(
        async(id: string, data: UpdateBusinessHoursDTO): Promise<BusinessHours | null> => {
            return await businessHoursRepository.update(id, data);
        },
        []
    );
//Alterar a disponibilidade de qualquer dia da semana
const toggleDayAvaliability = useCallback(
    async (
        id: string,
        day: DaysOfWeekField,
        enabled: boolean
    ): Promise<BusinessHours | null> => {
        return await businessHoursRepository.update(id, {[day]: enabled});
    },
    []
);
//Atualiza as informações do intervalo de almoço
const updateLunchBreak = useCallback(
    async (
        id: string,
        lunchBreakEnabled: boolean,
        lunchStartTime?: string,
        lunchEndTime?: string
    ): Promise<BusinessHours | null> => {
        return await businessHoursRepository.update(id, {
            lunchBreakEnabled,
            lunchStartTime,
            lunchEndTime,
        });
    },
    []
);
return {
    updateBusinessHours,
    toggleDayAvaliability,
    updateLunchBreak,
};
}