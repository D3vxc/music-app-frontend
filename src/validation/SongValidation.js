import { z } from "zod";
const SongValidation = z.object({
    songname: z.string(),
    artistname: z.string(),

})

export default SongValidation;