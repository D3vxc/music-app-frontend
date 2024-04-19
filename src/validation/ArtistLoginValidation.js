import { z } from "zod";
const LoginValidation = z.object({
    email: z.string().email(),
    password: z.string().min(8),
})

export default LoginValidation;