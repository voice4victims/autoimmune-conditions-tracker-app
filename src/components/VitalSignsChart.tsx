import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/contexts/AppContext';
import { vitalSignsService } from '@/lib/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface VitalSign {
  id: string;
  vital_type: string;
  value: number;
  unit: string;
  date_recorded: string;
}

const VITAL_LABELS: Record<string, string> = {
  temperature: 'Temperature',
  heart_rate: 'Heart Rate',
  blood_pressure_systolic: 'BP Systolic',
  blood_pressure_diastolic: 'BP Diastolic',
  weight: 'Weight',
  height: 'Height',
  oxygen_saturation: 'O2 Saturation',
  respiratory_rate: 'Respiratory Rate'
};

interface VitalSignsChartProps {
  refreshTrigger: number;
}

const VitalSignsChart: React.FC<VitalSignsChartProps> = ({ refreshTrigger }) => {
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [selectedVital, setSelectedVital] = useState('');
  const [loading, setLoading] = useState(true);
  const { childProfile } = useApp();
  const { user } = useAuth();

  const fetchVitals = async () => {
    if (!childProfile || !user) return;

    try {
      const vitals = await vitalSignsService.getVitalSigns(user.uid, childProfile.id);
      setVitals(vitals);

      // Set default selected vital if none selected
      if (!selectedVital && vitals && vitals.length > 0) {
        setSelectedVital(vitals[0].vital_type);
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
  }, [childProfile, user, refreshTrigger]);

  const filteredVitals = vitals.filter(v => v.vital_type === selectedVital);
  const chartData = filteredVitals.map(vital => ({
    date: format(new Date(vital.date_recorded), 'MMM d'),
    value: vital.value,
    fullDate: vital.date_recorded
  }));

  const uniqueVitalTypes = [...new Set(vitals.map(v => v.vital_type))];
  const selectedVitalInfo = vitals.find(v => v.vital_type === selectedVital);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  if (vitals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vital Signs Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No vital signs data available for charting.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Vital Signs Chart</span>
          <Select value={selectedVital} onValueChange={setSelectedVital}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select vital sign" />
            </SelectTrigger>
            <SelectContent>
              {uniqueVitalTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {VITAL_LABELS[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredVitals.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No data available for selected vital sign.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  label={{
                    value: selectedVitalInfo?.unit || '',
                    angle: -90,
                    position: 'insideLeft'
                  }}
                />
                <Tooltip
                  formatter={(value) => [value, selectedVitalInfo?.unit || '']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VitalSignsChart;