import { query } from "./_generated/server";

export const hello = query({
  args: {},
  handler: async () => {
    return "CatAgree is connected to Convex!";
  },
});
