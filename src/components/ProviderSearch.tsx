import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Phone, Globe, Star, Share2 } from 'lucide-react';
import { virginiaProviders } from '@/data/virginia-providers';
import { nationalProviders } from '@/data/national-providers';
import { UnifiedProvider } from '@/types/provider';
import ProviderCard from './ProviderCard';

const ProviderSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [pandasOnly, setPandasOnly] = useState(false);

  // Combine and normalize providers
  const allProviders: UnifiedProvider[] = useMemo(() => {
    const virginia = virginiaProviders.map(p => ({
      ...p,
      pandasExpert: p.pandasExpert || false,
      requiresReferral: p.type === 'traditional',
      reviews: [],
      availableAppointments: []
    }));

    const national = nationalProviders.map(p => ({
      ...p,
      location: `${p.city}, ${p.state}`,
      pandasExpert: p.pandasExperience || false,
      requiresReferral: p.type === 'integrative' || p.type === 'functional',
      reviews: [],
      availableAppointments: []
    }));

    return [...virginia, ...national];
  }, []);

  const filteredProviders = useMemo(() => {
    return allProviders.filter(provider => {
      const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           provider.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           provider.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || provider.type === typeFilter;
      const matchesPandas = !pandasOnly || provider.pandasExpert;
      
      return matchesSearch && matchesType && matchesPandas;
    });
  }, [allProviders, searchTerm, typeFilter, pandasOnly]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Provider Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search providers, specialties, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Provider Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="traditional">Traditional</SelectItem>
                <SelectItem value="integrative">Integrative</SelectItem>
                <SelectItem value="naturopathic">Naturopathic</SelectItem>
                <SelectItem value="homeopathic">Homeopathic</SelectItem>
                <SelectItem value="functional">Functional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pandasOnly}
                onChange={(e) => setPandasOnly(e.target.checked)}
                className="rounded"
              />
              PANDAS Experts Only
            </label>
            <Badge variant="secondary">
              {filteredProviders.length} providers found
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredProviders.map(provider => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </div>
  );
};

export default ProviderSearch;