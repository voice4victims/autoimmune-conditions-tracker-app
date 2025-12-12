import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChefHat } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { recipeService, enhancedRecipeService } from '@/lib/firebaseService';
import { toast } from '@/hooks/use-toast';
import RecipeForm from './RecipeForm';
import RecipeList from './RecipeList';

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

const SupplementRecipes: React.FC = () => {
  const { childProfile } = useApp();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (childProfile) {
      loadRecipes();
    }
  }, [childProfile]);

  const loadRecipes = async () => {
    if (!childProfile) return;

    try {
      const data = await recipeService.getRecipes(user?.id || '', childProfile.id);

      const formattedRecipes = data?.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description || '',
        instructions: recipe.instructions || '',
        ingredients: recipe.ingredients || [],
        notes: recipe.notes || '',
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at
      })) || [];

      setRecipes(formattedRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recipes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!childProfile) return;

    try {
      const recipeData = {
        child_id: childProfile.id,
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients,
        notes: recipe.notes,
        updated_at: new Date().toISOString()
      };

      if (editingRecipe) {
        await enhancedRecipeService.updateRecipe(editingRecipe.id, recipeData);
        toast({
          title: 'Success',
          description: 'Recipe updated successfully'
        });
      } else {
        await enhancedRecipeService.addRecipe({
          ...recipeData,
          user_id: user?.id,
          child_id: childProfile.id
        });
        toast({
          title: 'Success',
          description: 'Recipe created successfully'
        });
      }

      setShowForm(false);
      setEditingRecipe(null);
      loadRecipes();
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to save recipe',
        variant: 'destructive'
      });
    }
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      await enhancedRecipeService.deleteRecipe(recipeId);

      toast({
        title: 'Success',
        description: 'Recipe deleted successfully'
      });

      loadRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete recipe',
        variant: 'destructive'
      });
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRecipe(null);
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <ChefHat className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Child Selected
          </h3>
          <p className="text-gray-500 text-center">
            Please select a child profile to manage supplement recipes
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading recipes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supplement Recipes</h2>
          <p className="text-gray-600">Manage custom supplement mixing recipes for {childProfile.name}</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Recipe
          </Button>
        )}
      </div>

      {showForm ? (
        <RecipeForm
          onSave={handleSaveRecipe}
          onCancel={handleCancelForm}
          existingRecipe={editingRecipe}
        />
      ) : (
        <RecipeList
          recipes={recipes}
          onEdit={handleEditRecipe}
          onDelete={handleDeleteRecipe}
        />
      )}
    </div>
  );
};

export default SupplementRecipes;