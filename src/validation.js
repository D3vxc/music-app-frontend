import { z } from "zod";

const password = z.string().min(8, "Password must be at least 8 characters");
const email = z.string().trim().email("Enter a valid email");

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
});

export const listenerSchema = z.object({
  name: z.string().trim().min(1, "What should we call you?").max(80),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_.]{3,40}$/, "3-40 letters, numbers, dots or underscores"),
  email,
  password,
});

export const artistSchema = z.object({
  name: z.string().trim().min(1, "Artist name is required").max(80),
  email,
  password,
  bio: z.string().max(1000).optional(),
});

export const songSchema = z.object({
  title: z.string().trim().min(1, "Give your song a title").max(120),
  album: z.string().trim().max(120).optional(),
  genre: z.string().trim().max(40).optional(),
});
