/**
 * Google Calendar Event URL Generator
 * Enables 1-click scheduling into Google Calendar without requiring complex OAuth consents,
 * pre-populating client info, assigned agent, notes, and GPS/address data.
 */

export interface GoogleCalendarEventParams {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes?: number;
  description?: string;
  location?: string;
  attendeeEmail?: string;
}

export function buildGoogleCalendarUrl({
  title,
  date,
  time,
  durationMinutes = 60,
  description = '',
  location = '',
  attendeeEmail = ''
}: GoogleCalendarEventParams): string {
  try {
    const [year, month, day] = (date || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const [hours, minutes] = (time || '10:00').split(':').map(Number);

    const startDate = new Date(year, (month || 1) - 1, day || 1, hours || 10, minutes || 0, 0);
    const endDate = new Date(startDate.getTime() + (durationMinutes || 60) * 60 * 1000);

    const pad = (n: number) => String(n).padStart(2, '0');
    
    // Format: YYYYMMDDTHHmmss
    const formatGCal = (d: Date) => 
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

    const dates = `${formatGCal(startDate)}/${formatGCal(endDate)}`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: dates,
      details: description,
      location: location
    });

    if (attendeeEmail) {
      params.append('add', attendeeEmail);
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch (err) {
    console.error('Error generating Google Calendar URL:', err);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}`;
  }
}
