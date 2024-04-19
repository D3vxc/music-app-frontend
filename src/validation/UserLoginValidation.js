import { z } from "zod";
const LoginValidation = z.object({
    username: z.string(),
    password: z.string().min(8),
})

export default LoginValidation;