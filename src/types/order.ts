import { z } from 'zod';

export const orderSideSchema = z.enum(['buy', 'sell']);
export type OrderSide = z.infer<typeof orderSideSchema>;

export const orderTypeSchema = z.enum(['limit', 'market']);
export type OrderType = z.infer<typeof orderTypeSchema>;
