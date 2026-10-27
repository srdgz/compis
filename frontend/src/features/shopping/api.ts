import { z } from "zod";

import { request } from "@/shared/api/http";

export const shoppingListSchema = z.object({
  id: z.number(),
  name: z.string(),
  home_id: z.number(),
});

export const shoppingItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  shopping_list_id: z.number(),
  expense_id: z.number().nullable(),
});

export type ShoppingList = z.infer<typeof shoppingListSchema>;
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;

export const shoppingApi = {
  getList: (homeId: number) => request(`/list/home/${homeId}`, { schema: shoppingListSchema }),
  listItems: (listId: number, purchased: boolean) =>
    request(`/item/list/${listId}${purchased ? "?have_expense=true" : ""}`, {
      schema: z.array(shoppingItemSchema),
    }),
  addItem: (listId: number, name: string) =>
    request("/item", {
      method: "POST",
      body: { name, shopping_list_id: listId },
      schema: shoppingItemSchema,
    }),
  removeItem: (id: number) => request(`/item/${id}`, { method: "DELETE" }),
};
