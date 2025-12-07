import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, User, Settings, LogOut } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import ChildProfileForm from './ChildProfileForm';

const ProfileMenu: React.FC = () => {
  const { children, deleteChild } = useApp();
  const { signOut, demoMode } = useAuth();
  const [showAddChild, setShowAddChild] = useState(false);

  const handleChildAdded = () => {
    setShowAddChild(false);
  };

  const handleDeleteChild = async (childId: string) => {
    if (window.confirm('Are you sure you want to delete this child profile?')) {
      await deleteChild(childId);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile Management</h2>
          {demoMode && (
            <p className="text-sm text-orange-600 mt-1">Demo Mode - Data is not saved</p>
          )}
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddChild} onOpenChange={setShowAddChild}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Child
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Child Profile</DialogTitle>
              </DialogHeader>
              <ChildProfileForm onChildAdded={handleChildAdded} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            {demoMode ? 'Exit Demo' : 'Sign Out'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => (
          <Card key={child.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">{child.name}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteChild(child.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
              <CardDescription>
                Age: {child.age} | DOB: {new Date(child.dateOfBirth).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {child.diagnosisDate && (
                <p className="text-sm text-gray-600">
                  Diagnosis: {new Date(child.diagnosisDate).toLocaleDateString()}
                </p>
              )}
              {child.notes && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                  {child.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {children.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No Children Added Yet
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Add your first child profile to start tracking symptoms
            </p>
            <Button onClick={() => setShowAddChild(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Child
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileMenu;