import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, MapPin, AlertCircle } from 'lucide-react';
import { UnifiedProvider } from '@/types/provider';

interface AppointmentBookingProps {
  provider: UnifiedProvider;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ provider }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('in-person');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock available dates and times
  const availableDates = [
    '2024-01-15',
    '2024-01-16',
    '2024-01-17',
    '2024-01-18',
    '2024-01-19'
  ];

  const availableTimes = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM'
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // In a real app, this would submit to a backend
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Appointment request submitted! You will receive a confirmation email shortly.');
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {provider.requiresReferral && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <div className="text-sm">
            <p className="font-medium text-orange-800">Referral Required</p>
            <p className="text-orange-700">Please obtain a referral from your primary care physician before booking.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Appointment Type</label>
          <Select value={appointmentType} onValueChange={setAppointmentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-person">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  In-Person
                </div>
              </SelectItem>
              {provider.telemedicine && (
                <SelectItem value="telemedicine">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Telemedicine
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Preferred Date</label>
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger>
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent>
              {availableDates.map(date => (
                <SelectItem key={date} value={date}>
                  {new Date(date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Preferred Time</label>
        <div className="grid grid-cols-3 gap-2">
          {availableTimes.map(time => (
            <Button
              key={time}
              variant={selectedTime === time ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTime(time)}
              className="text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              {time}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Patient Name *</label>
          <Input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Enter patient name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Phone Number *</label>
          <Input
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            placeholder="(555) 123-4567"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Email Address *</label>
        <Input
          type="email"
          value={patientEmail}
          onChange={(e) => setPatientEmail(e.target.value)}
          placeholder="patient@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Reason for Visit</label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Brief description of symptoms or reason for appointment..."
          rows={3}
        />
      </div>

      {provider.acceptsInsurance && (
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">Insurance Accepted</Badge>
            <span className="text-sm text-green-700">Please bring your insurance card to the appointment.</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button 
          onClick={handleSubmit}
          disabled={!patientName || !patientPhone || !patientEmail || !selectedDate || !selectedTime || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Submitting...' : 'Request Appointment'}
        </Button>
      </div>

      <div className="text-xs text-gray-600">
        <p>* This is a request. The provider's office will contact you to confirm the appointment.</p>
      </div>
    </div>
  );
};

export default AppointmentBooking;