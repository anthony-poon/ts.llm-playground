import { z } from "zod";

const UserSchema = z.object({
    id: z.number(),
    is_bot: z.boolean(),
    first_name: z.string(),
    last_name: z.string().optional(),
    language_code: z.string().optional(),
    username: z.string().optional()
})

const ChatSchema =  z.object({
    id: z.number(),
    type: z.enum(["private", "group", "supergroup", "channel"]),
    title: z.string().optional(),
});

export const WebhookSchema = z.object({
    update_id: z.number(),
    message: z.object({
        message_id: z.number(),
        from: UserSchema,
        chat: ChatSchema,
        date: z.number(),
        text: z.string(),
    }),
})

export type UserRequest = z.infer<typeof UserSchema>
export type ChatRequest = z.infer<typeof ChatSchema>
export type WebhookRequest = z.infer<typeof WebhookSchema>