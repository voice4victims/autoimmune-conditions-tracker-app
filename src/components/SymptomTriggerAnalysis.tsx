import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


export const SymptomTriggerAnalysis = () => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const handleAnalyzeAction = async () => {
    setIsLoading(true);
    // In a real application, you would fetch data and perform analysis.
    // For this example, we'''ll simulate it with a timeout.
    setTimeout(() => {
      let analysisResult = "Analysis complete.";
      if (startDate && endDate) {
        analysisResult += ` We'''ve analyzed the period from ${format(startDate, 'PPP')} to ${format(endDate, 'PPP')} and identified a potential correlation between [Symptom] and [Trigger].`
      } else {
        analysisResult += " We'''ve identified a potential correlation between [Symptom] and [Trigger]."
      }
      setAnalysis(analysisResult);
      setIsLoading(false);
    }, 2000);
  };

  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Symptom Trigger Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>
            Discover potential triggers for your symptoms by analyzing your logged data. This tool can help you identify patterns and correlations.
          </p>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) =>
                    date > today || date < oneYearAgo
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>End date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) =>
                    date > today || date < oneYearAgo || (startDate && date < startDate)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleAnalyzeAction} disabled={isLoading || !startDate || !endDate}>
            {isLoading ? 'Analyzing...' : 'Analyze Symptom Triggers'}
          </Button>
          {analysis && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {analysis}
              </AlertDescription>
            </Alert>
          )}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This is not a medical diagnosis. Always consult with a healthcare professional for medical advice.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};
