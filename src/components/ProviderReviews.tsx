import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, Plus } from 'lucide-react';
import { UnifiedProvider, Review } from '@/types/provider';

interface ProviderReviewsProps {
  provider: UnifiedProvider;
}

const ProviderReviews: React.FC<ProviderReviewsProps> = ({ provider }) => {
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReview, setNewReview] = useState({
    patientName: '',
    rating: 5,
    comment: ''
  });

  // Mock reviews for demonstration
  const mockReviews: Review[] = [
    {
      id: '1',
      patientName: 'Sarah M.',
      rating: 5,
      comment: 'Excellent care for my child with PANDAS. Very knowledgeable and compassionate.',
      date: '2024-01-15',
      verified: true
    },
    {
      id: '2',
      patientName: 'John D.',
      rating: 4,
      comment: 'Great experience overall. Wait times can be long but worth it.',
      date: '2024-01-10',
      verified: true
    }
  ];

  const reviews = provider.reviews?.length ? provider.reviews : mockReviews;

  const handleSubmitReview = () => {
    // In a real app, this would submit to a backend
    console.log('Submitting review:', newReview);
    setShowAddReview(false);
    setNewReview({ patientName: '', rating: 5, comment: '' });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="flex">{renderStars(provider.rating || 4.5)}</div>
          <span className="font-medium">{provider.rating || 4.5}/5</span>
          <span className="text-sm text-gray-600">({reviews.length} reviews)</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowAddReview(!showAddReview)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Review
        </Button>
      </div>

      {showAddReview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Your Name</label>
              <Input
                value={newReview.patientName}
                onChange={(e) => setNewReview({ ...newReview, patientName: e.target.value })}
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Rating</label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 cursor-pointer ${
                      i < newReview.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                    }`}
                    onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Comment</label>
              <Textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="Share your experience..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSubmitReview}>Submit Review</Button>
              <Button variant="outline" onClick={() => setShowAddReview(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.patientName}</span>
                    {review.verified && (
                      <Badge variant="secondary" className="text-xs">Verified</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-sm text-gray-600">{review.date}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700">{review.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProviderReviews;