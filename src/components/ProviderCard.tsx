import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Phone, Globe, Star, Share2, Calendar, AlertCircle, Mail } from 'lucide-react';
import { UnifiedProvider } from '@/types/provider';
import ProviderReviews from './ProviderReviews';
import AppointmentBooking from './AppointmentBooking';
import ProviderShare from './ProviderShare';

interface ProviderCardProps {
  provider: UnifiedProvider;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider }) => {
  const [showReviews, setShowReviews] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const getTypeColor = (type: string) => {
    const colors = {
      traditional: 'bg-blue-100 text-blue-800',
      integrative: 'bg-green-100 text-green-800',
      naturopathic: 'bg-purple-100 text-purple-800',
      homeopathic: 'bg-orange-100 text-orange-800',
      functional: 'bg-teal-100 text-teal-800',
      holistic: 'bg-pink-100 text-pink-800',
      chiropractic: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {provider.name}
              {provider.pandasExpert && (
                <Badge className="bg-red-100 text-red-800">PANDAS Expert</Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{provider.specialty}</p>
          </div>
          <Badge className={getTypeColor(provider.type)}>
            {provider.type.charAt(0).toUpperCase() + provider.type.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              {provider.location}
            </div>
            
            {provider.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-500" />
                <a href={`tel:${provider.phone}`} className="text-blue-600 hover:underline">
                  {provider.phone}
                </a>
              </div>
            )}
            
            {provider.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline">
                  {provider.email}
                </a>
              </div>
            )}
            
            {provider.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-gray-500" />
                <a href={provider.website} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline">
                  Website
                </a>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {provider.rating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{provider.rating}/5</span>
              </div>
            )}
            
            {provider.requiresReferral && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="h-4 w-4" />
                Referral Required
              </div>
            )}
            
            {provider.telemedicine && (
              <Badge variant="outline" className="text-xs">Telemedicine Available</Badge>
            )}
            
            {provider.acceptsInsurance && (
              <Badge variant="outline" className="text-xs">Accepts Insurance</Badge>
            )}
          </div>
        </div>
        
        {provider.treatments && provider.treatments.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Treatments:</p>
            <div className="flex flex-wrap gap-1">
              {provider.treatments.slice(0, 4).map((treatment, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {treatment}
                </Badge>
              ))}
              {provider.treatments.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{provider.treatments.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Dialog open={showReviews} onOpenChange={setShowReviews}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Reviews</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Reviews for {provider.name}</DialogTitle>
              </DialogHeader>
              <ProviderReviews provider={provider} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={showBooking} onOpenChange={setShowBooking}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book Appointment with {provider.name}</DialogTitle>
              </DialogHeader>
              <AppointmentBooking provider={provider} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={showShare} onOpenChange={setShowShare}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Provider Information</DialogTitle>
              </DialogHeader>
              <ProviderShare provider={provider} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderCard;