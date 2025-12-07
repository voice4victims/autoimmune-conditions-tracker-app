import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface RecipeFormProps {
  onSave: (recipe: any) => void;
  onCancel: () => void;
  existingRecipe?: any;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ onSave, onCancel, existingRecipe }) => {
  const [name, setName] = useState(existingRecipe?.name || '');
  const [description, setDescription] = useState(existingRecipe?.description || '');
  const [instructions, setInstructions] = useState(existingRecipe?.instructions || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    existingRecipe?.ingredients || [{ name: '', amount: '', unit: '' }]
  );
  const [notes, setNotes] = useState(existingRecipe?.notes || '');

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = ingredients.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    );
    setIngredients(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipe = {
      id: existingRecipe?.id || Date.now().toString(),
      name,
      description,
      instructions,
      ingredients: ingredients.filter(ing => ing.name.trim()),
      notes,
      createdAt: existingRecipe?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(recipe);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingRecipe ? 'Edit Recipe' : 'New Supplement Recipe'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Recipe Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily Vitamin Mix"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the supplement mix"
            />
          </div>

          <div>
            <Label>Ingredients</Label>
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  placeholder="Supplement name"
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Amount"
                  value={ingredient.amount}
                  onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                  className="w-24"
                />
                <Input
                  placeholder="Unit"
                  value={ingredient.unit}
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  className="w-20"
                />
                {ingredients.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addIngredient}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Ingredient
            </Button>
          </div>

          <div>
            <Label htmlFor="instructions">Mixing Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="How to prepare this supplement mix..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes, storage instructions, etc."
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              {existingRecipe ? 'Update Recipe' : 'Save Recipe'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RecipeForm;