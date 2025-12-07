import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ChefHat } from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  description: string;
  instructions: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface RecipeListProps {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onEdit, onDelete }) => {
  if (recipes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <ChefHat className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Recipes Yet
          </h3>
          <p className="text-gray-500 text-center">
            Create your first supplement recipe to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recipes.map((recipe) => (
        <Card key={recipe.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{recipe.name}</CardTitle>
                {recipe.description && (
                  <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(recipe)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(recipe.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Ingredients:</h4>
                <div className="flex flex-wrap gap-1">
                  {recipe.ingredients.map((ingredient, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {ingredient.name} - {ingredient.amount} {ingredient.unit}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {recipe.instructions && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Instructions:</h4>
                  <p className="text-sm text-gray-700">{recipe.instructions}</p>
                </div>
              )}
              
              {recipe.notes && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Notes:</h4>
                  <p className="text-sm text-gray-600">{recipe.notes}</p>
                </div>
              )}
              
              <div className="text-xs text-gray-500 pt-2 border-t">
                Created: {new Date(recipe.createdAt).toLocaleDateString()}
                {recipe.updatedAt !== recipe.createdAt && (
                  <span className="ml-2">
                    • Updated: {new Date(recipe.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RecipeList;