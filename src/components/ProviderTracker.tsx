import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import ProviderForm from './ProviderForm';
import ProviderList from './ProviderList';
import { useApp } from '@/contexts/AppContext';

const ProviderTracker: React.FC = () => {
  const { childProfile } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleProviderAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowForm(false);
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Please select a child profile to manage healthcare providers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Healthcare Providers</h2>
          <p className="text-gray-600">Manage your child's healthcare team</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </Button>
      </div>

      {showForm && (
        <ProviderForm
          childId={childProfile.id}
          onProviderAdded={handleProviderAdded}
        />
      )}

      <ProviderList
        childId={childProfile.id}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default ProviderTracker;