import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver} from "@hookform/resolvers/zod";
import { useCreatePaymentMutation } from "@/presentation/payments/api/useCreatePaymentMutation";
import { usePaymentMethods } from "@/presentation/payments/queries/usePaymentMethods";

const schema = z.object({
    amount: z.coerce.number().positive("O valor digitado deve ser positivo"),
    method: z.string().min(1, "Selecione um método de pagamento"),
})

export type  CreatePaymentFormValues = z.infer<typeof schema>;

export function CreatePaymentForm(){
    const { data: methods } = usePaymentMethods();
    const { mutate:createPayment, isLoading:isCreating } = useCreatePaymentMutation();

    const form = useForm({
        resolver: zodResolver(schema)
    })


    function onSubmit(values: CreatePaymentFormValues){
        createPayment(values);
    }

    return (
      <form onSubmit={form.handleSubmit(onSubmit)}>

        <input
        type = "number"
        step = "0.01"
        placeholder = "Valor"
        {...form.register("amount")}
        />

       <select {...form.register("method")}>
        <option value="">Selecione um método: </option>
       {methods?.map((m) => (
          <option key={m.id} value={m.id}>
            {m.payName}
          </option>
       ))}
       </select>
       
       <button type="submit" disabled={isCreating}>
        {isCreating ? "Criando..." : "Criar pagamento"}
        
        </button>
      </form>
    );
}