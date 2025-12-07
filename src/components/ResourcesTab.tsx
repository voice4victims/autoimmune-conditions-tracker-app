import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Heart, Users, BookOpen, Shield } from 'lucide-react';

const ResourcesTab: React.FC = () => {
  const resources = [
    {
      title: "Neuroimmune Foundation - PTEC Tool",
      description: "Official PANS/PANDAS Treatment Evaluation Checklist (PTEC) - a validated tool for tracking symptom changes over time.",
      url: "https://neuroimmune.org/pans-pandas-treatment-evaluation-checklist/",
      icon: <Shield className="w-5 h-5" />,
      category: "Assessment Tool"
    },
    {
      title: "PANDAS/PANS School Handbook for Educators",
      description: "Comprehensive handbook from NHFV helping educators understand and support students with PANDAS/PANS in school settings.",
      url: "https://nhfv.org/library/pandas-pans-school-settings-handbook-educators/",
      icon: <BookOpen className="w-5 h-5" />,
      category: "Educational Resource"
    },

    {
      title: "The Alex Manfull Fund",
      description: "Supporting families affected by PANDAS/PANS with research, education, and advocacy.",
      url: "https://thealexmanfullfund.org/",
      icon: <Heart className="w-5 h-5" />,
      category: "Support Organization"
    },
    {
      title: "PANDAS Network",
      description: "Leading organization providing resources, support, and advocacy for PANDAS/PANS families.",
      url: "https://pandasnetwork.org/",
      icon: <Users className="w-5 h-5" />,
      category: "Support Organization"
    },
    {
      title: "NIMH - PANDAS Information",
      description: "National Institute of Mental Health official information about PANDAS.",
      url: "https://www.nimh.nih.gov/health/publications/pandas",
      icon: <Shield className="w-5 h-5" />,
      category: "Medical Information"
    },
    {
      title: "PANDAS Physicians Network",
      description: "Directory of healthcare providers experienced with PANDAS/PANS treatment.",
      url: "https://pandasppn.org/",
      icon: <BookOpen className="w-5 h-5" />,
      category: "Medical Resources"
    },
    {
      title: "International OCD Foundation",
      description: "Resources for OCD and related disorders including PANDAS/PANS.",
      url: "https://iocdf.org/pandas/",
      icon: <BookOpen className="w-5 h-5" />,
      category: "Medical Information"
    }
  ];


  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Additional Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Trusted sources for PANDAS/PANS information, support, and medical resources.
          </p>
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {resource.icon}
                        <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {resource.category}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLinkClick(resource.url)}
                      className="flex items-center gap-2 touch-manipulation"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourcesTab;