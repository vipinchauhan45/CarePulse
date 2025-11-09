import {z} from "zod";

const signupSchema = z.object({
  name: z.string().min(3, "username must be at least 3 character long"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "password must be at least 8 characters long"),
  role: z.enum(["doctor", "nurse","admin"]),
});

export default signupSchema;