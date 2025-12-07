import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpCircle, Activity, Clock, Utensils, Users, Heart, Pill, Bell, ChefHat, FileText, BarChart3, Calendar, Files } from 'lucide-react';

const FAQ: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="getting-started">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    How do I get started with the app?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    First, create a child profile by entering their name, age, and diagnosis date. 
                    Once created, you can start tracking symptoms, activities, and treatments. 
                    Use the main tabs to navigate between different tracking features.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="track-tab">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    What is the Track tab for?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The Track tab is your main symptom tracking interface. Here you can:
                    • Log daily symptoms with severity ratings (1-10)
                    • Add custom symptoms specific to your child
                    • View recent symptom entries
                    • Track patterns over time
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="activities-tab">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    How do I use the Activities tab?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The Activities tab helps you track daily activities and their potential correlation with symptoms:
                    • Log activities like school, sports, social events
                    • Record duration and intensity
                    • Note any observations or triggers
                    • View activity history and patterns
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="food-tab">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4" />
                    What can I track in the Food tab?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The Food tab is your food diary for tracking dietary factors:
                    • Log meals, snacks, and beverages
                    • Note food reactions or sensitivities
                    • Track elimination diets
                    • Monitor nutritional supplements
                    • Identify potential food triggers
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="family-tab">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    How does Family sharing work?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The Family tab allows you to share access with other family members:
                    • Send invitations to family members via email
                    • Generate invite codes for easy sharing
                    • Manage who has access to your child's data
                    • Revoke access when needed
                    • Accept invitations from other family members
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="self-care">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    What is Self Care in the More menu?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Self Care provides resources and guidance for parents:
                    • Stress management techniques
                    • Coping strategies for difficult days
                    • Self-care reminders and tips
                    • Support resources and links
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="vitals">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    How do I track Vitals?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Vitals tracking helps monitor physical health indicators:
                    • Record temperature, heart rate, blood pressure
                    • Track weight and height changes
                    • Monitor sleep patterns
                    • View trends over time with charts
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="treatments">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    What can I track in Treatments?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Treatments section helps you manage medical interventions:
                    • Log medications and dosages
                    • Track antibiotic courses
                    • Record therapy sessions
                    • Monitor treatment effectiveness
                    • Note side effects or reactions
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="reminders">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    How do Reminders work?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Reminders help you stay on top of important tasks:
                    • Set medication reminders
                    • Schedule appointment alerts
                    • Create custom reminders for treatments
                    • Receive notifications at set times
                    • Track completion of reminder tasks
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="recipes">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4" />
                    What are Recipes for?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Recipes section provides nutritional support:
                    • PANDAS-friendly meal ideas
                    • Supplement preparation guides
                    • Anti-inflammatory recipes
                    • Elimination diet meal plans
                    • Save your own successful recipes
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="notes">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    How do I use Notes?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Notes allow you to record important observations:
                    • Daily behavior notes
                    • Doctor visit summaries
                    • Treatment observations
                    • Trigger patterns you notice
                    • Questions for medical appointments
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="history">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    What does History show me?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    History provides visual analysis of your data:
                    • Line charts showing symptom trends over time
                    • Bar charts comparing different symptoms
                    • Identify patterns and correlations
                    • Export charts for medical appointments
                    • View data over different time periods
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="heatmap">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    How do I read the Heatmap?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The Heatmap shows symptom intensity over time:
                    • Calendar view with color-coded severity
                    • Quickly identify good and bad days
                    • Spot weekly or monthly patterns
                    • Darker colors indicate higher severity
                    • Click on dates to see detailed information
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="providers">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    How do I manage Providers?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Providers section helps organize your medical team:
                    • Add doctors, therapists, and specialists
                    • Store contact information and notes
                    • Track appointment history
                    • Record provider recommendations
                    • Manage referrals and communications
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="files">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Files className="w-4 h-4" />
                    What can I store in Files?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Files section is your document storage:
                    • Upload medical records and test results
                    • Store photos of symptoms or rashes
                    • Save important documents and reports
                    • Organize files by category or date
                    • Easy access during medical appointments
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tips">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Any tips for effective tracking?
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Here are some tips for successful tracking:
                    • Be consistent - track daily for best results
                    • Use the same time each day when possible
                    • Don't worry about missing a day - just continue
                    • Look for patterns over weeks, not individual days
                    • Share data with your medical team
                    • Use notes to record context and observations
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQ;