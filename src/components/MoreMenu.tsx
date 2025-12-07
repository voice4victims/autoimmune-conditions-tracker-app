import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Activity, Pill, Clock, ChefHat, FileText, BarChart3, Calendar, Stethoscope, FolderOpen, Mail, Shield, BookOpen, ClipboardCheck, Brain } from 'lucide-react';


interface MoreMenuProps {
  activeMoreTab: string | null;
  onMoreTabClick: (tab: string) => void;
  onBackToMenu: () => void;
}

const MoreMenu: React.FC<MoreMenuProps> = ({ activeMoreTab, onMoreTabClick, onBackToMenu }) => {
  if (activeMoreTab) {
    return (
      <div className="mb-4">
        <Button 
          variant="outline" 
          onClick={onBackToMenu}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Button>
      </div>
    );
  }

  const menuItems = [
    { id: 'analytics', label: 'Analytics', icon: Brain, description: 'Advanced treatment analysis' },
    { id: 'ptec', label: 'PTEC', icon: ClipboardCheck, description: 'Treatment evaluation checklist' },
    { id: 'selfcare', label: 'Self Care', icon: Heart, description: 'Wellness tips and guidance' },
    { id: 'vitals', label: 'Vital Signs', icon: Activity, description: 'Track temperature, heart rate, etc.' },
    { id: 'treatments', label: 'Treatments', icon: Pill, description: 'Log medications and therapies' },
    { id: 'reminders', label: 'Reminders', icon: Clock, description: 'Set medication reminders' },
    { id: 'recipes', label: 'Recipes', icon: ChefHat, description: 'Supplement and meal recipes' },
    { id: 'notes', label: 'Notes', icon: FileText, description: 'Daily observations and notes' },
    { id: 'history', label: 'History', icon: BarChart3, description: 'View symptom charts and trends' },
    { id: 'heatmap', label: 'Heatmap', icon: Calendar, description: 'Visual symptom calendar' },
    { id: 'providers', label: 'Providers', icon: Stethoscope, description: 'Manage healthcare providers' },
    { id: 'files', label: 'Files', icon: FolderOpen, description: 'Upload and manage documents' },
    { id: 'email', label: 'Email Records', icon: Mail, description: 'Send records to doctor' },
    { id: 'drug-safety', label: 'Drug Safety', icon: Shield, description: 'Check interactions & report side effects' },
    { id: 'resources', label: 'Resources', icon: BookOpen, description: 'Trusted PANDAS/PANS resources' }
  ];


  return (
    <Card>
      <CardHeader>
        <CardTitle>More Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Button
                key={item.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 text-center"
                onClick={() => onMoreTabClick(item.id)}
              >
                <IconComponent className="w-6 h-6" />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MoreMenu;
