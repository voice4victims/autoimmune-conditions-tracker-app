import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Heart, Brain, Clock, Users, Smile, Moon, Coffee, Book } from 'lucide-react';

const SelfCareGuide: React.FC = () => {
  const physicalCare = [
    { title: 'Regular Exercise', desc: 'Even 10-15 minutes of walking daily can reduce stress and improve mood', icon: Heart },
    { title: 'Adequate Sleep', desc: 'Aim for 7-9 hours of quality sleep. Create a bedtime routine', icon: Moon },
    { title: 'Nutritious Meals', desc: 'Eat regular, balanced meals. Prep healthy snacks in advance', icon: Coffee },
    { title: 'Stay Hydrated', desc: 'Keep a water bottle nearby and drink throughout the day', icon: Heart }
  ];

  const mentalCare = [
    { title: 'Mindfulness Practice', desc: 'Try 5-10 minutes of meditation or deep breathing daily', icon: Brain },
    { title: 'Journaling', desc: 'Write down thoughts and feelings to process emotions', icon: Book },
    { title: 'Limit Information Overload', desc: 'Set boundaries on medical research and social media', icon: Brain },
    { title: 'Practice Gratitude', desc: 'List 3 things you\'re grateful for each day', icon: Smile }
  ];

  const socialCare = [
    { title: 'Connect with Others', desc: 'Reach out to friends, family, or support groups', icon: Users },
    { title: 'Ask for Help', desc: 'Accept offers of assistance with meals, errands, or childcare', icon: Heart },
    { title: 'Professional Support', desc: 'Consider counseling or therapy for additional support', icon: Users },
    { title: 'Online Communities', desc: 'Join PANDAS/PANS parent support groups online', icon: Users }
  ];

  const timeManagement = [
    { title: 'Schedule "Me Time"', desc: 'Block out time for yourself, even if it\'s just 15 minutes', icon: Clock },
    { title: 'Prioritize Tasks', desc: 'Focus on what\'s most important and let go of perfectionism', icon: Clock },
    { title: 'Delegate Responsibilities', desc: 'Share household tasks with family members', icon: Users },
    { title: 'Say No', desc: 'It\'s okay to decline additional commitments', icon: Clock }
  ];

  const CareSection = ({ items, color }: { items: any[], color: string }) => (
    <div className="grid gap-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index} className="border-l-4" style={{ borderLeftColor: color }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-1" style={{ color }} />
                <div>
                  <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-800">
            <Heart className="w-5 h-5" />
            Self-Care for Caregivers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-pink-700 mb-4">
            Caring for a child with PANDAS/PANS can be overwhelming. Taking care of yourself isn't selfish—it's essential for your well-being and your ability to care for your child.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-pink-100 text-pink-800">You Matter Too</Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">Self-Care is Healthcare</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Small Steps Count</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="physical" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="physical" className="text-xs">Physical</TabsTrigger>
          <TabsTrigger value="mental" className="text-xs">Mental</TabsTrigger>
          <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
          <TabsTrigger value="time" className="text-xs">Time</TabsTrigger>
        </TabsList>

        <TabsContent value="physical" className="mt-4">
          <CareSection items={physicalCare} color="#ef4444" />
        </TabsContent>

        <TabsContent value="mental" className="mt-4">
          <CareSection items={mentalCare} color="#8b5cf6" />
        </TabsContent>

        <TabsContent value="social" className="mt-4">
          <CareSection items={socialCare} color="#06b6d4" />
        </TabsContent>

        <TabsContent value="time" className="mt-4">
          <CareSection items={timeManagement} color="#f59e0b" />
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Remember:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• You can't pour from an empty cup</li>
            <li>• Taking breaks doesn't make you a bad parent</li>
            <li>• Your mental health affects your child's well-being</li>
            <li>• It's okay to have difficult days</li>
            <li>• Seeking help is a sign of strength, not weakness</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelfCareGuide;