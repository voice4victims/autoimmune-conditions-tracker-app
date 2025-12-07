import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Phone, Mail, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface Provider {
  id: string;
  name: string;
  title?: string;
  role?: string;
  specialty?: string;
  contact_info?: string;
  notes?: string;
  created_at: string;
}

interface ProviderListProps {
  childId: string;
  refreshTrigger: number;
}

const ProviderList: React.FC<ProviderListProps> = ({ childId, refreshTrigger }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('healthcare_providers')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({ title: 'Error', description: 'Failed to load providers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteProvider = async (id: string) => {
    try {
      const { error } = await supabase
        .from('healthcare_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProviders(providers.filter(p => p.id !== id));
      toast({ title: 'Success', description: 'Provider deleted successfully' });
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast({ title: 'Error', description: 'Failed to delete provider', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [childId, refreshTrigger]);

  if (loading) {
    return <div className="text-center py-4">Loading providers...</div>;
  }

  if (providers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No healthcare providers added yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <Card key={provider.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {provider.name}
                  {provider.title && <span className="text-sm font-normal text-gray-500 ml-2">{provider.title}</span>}
                </CardTitle>
                <div className="flex gap-2 mt-2">
                  {provider.role && <Badge variant="secondary">{provider.role}</Badge>}
                  {provider.specialty && <Badge variant="outline">{provider.specialty}</Badge>}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteProvider(provider.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {provider.contact_info && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Phone className="w-4 h-4" />
                <span>{provider.contact_info}</span>
              </div>
            )}
            {provider.notes && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                <strong>Notes:</strong> {provider.notes}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProviderList;