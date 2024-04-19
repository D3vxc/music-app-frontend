import { z } from "zod";
const RegisterValidation = z.object({
    firstname: z.string(),
    lastname: z.string(),
    username: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
})

export default RegisterValidation;