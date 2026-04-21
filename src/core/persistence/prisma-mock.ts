/**
 * Prisma Mock for Frontend Bundling
 *
 * This file provides lightweight placeholders for Prisma-related modules
 * to prevent Vite from attempting to bundle server-side code for the browser.
 */

export const PrismaClient = class {
  constructor() {
    return new Proxy({}, {
      get: () => () => {
        throw new Error("Prisma client is not available in the browser.");
      }
    });
  }
};

export const prisma = new PrismaClient();

export default {
  PrismaClient,
  prisma,
};
