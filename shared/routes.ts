
import { z } from 'zod';
import { insertUserSettingsSchema, userSettings } from './schema';

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export const api = {
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings/:sessionId',
      responses: {
        200: z.custom<typeof userSettings.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    save: {
      method: 'POST' as const,
      path: '/api/settings',
      input: insertUserSettingsSchema,
      responses: {
        200: z.custom<typeof userSettings.$inferSelect>(),
      },
    },
  },
};
