import { Prisma } from '@prisma/client';
import { TenantContext } from '../../../gateway/tenant-context.interface';

export interface RecipeIngredient {
  item_id: string;
  quantity: Prisma.Decimal;
  unit: string;
}

export interface Recipe {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
  baseCost: Prisma.Decimal;
  suggestedPrice: Prisma.Decimal;
  created_at: Date;
  updated_at: Date;
}

export abstract class FnbRepository {
  abstract getRecipes(ctx: TenantContext): Promise<Recipe[]>;
  abstract getRecipeById(ctx: TenantContext, id: string): Promise<Recipe | null>;
  abstract createRecipe(ctx: TenantContext, data: any): Promise<Recipe>;
  
  /**
   * Enterprise Hook: Recipe-to-Inventory deductive link
   * Deducts ingredients from Inventory when a recipe is sold/produced.
   */
  abstract deductIngredientsFromInventory(ctx: TenantContext, recipeId: string, yieldQuantity: number): Promise<void>;
}
