const defaultVariables = {
  companyName: 'Intal',
  companyEmail: 'info@intal.nl',
  companyWebsite: 'www.intal.nl',
  signatureText: 'Met vriendelijke groet,',
  teamName: 'Intalligence',
  supportEmail: 'support@intal.nl',
  currentYear: new Date().getFullYear().toString(),
  currentDate: new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  currentTime: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  currentDateTime: new Date().toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }),
  currentDay: new Date().toLocaleDateString('nl-NL', { weekday: 'long' }),
  currentMonth: new Date().toLocaleDateString('nl-NL', { month: 'long' })
};

export default defaultVariables;
