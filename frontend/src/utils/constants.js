export const CURRENCY = {
  code: 'CAD',
  symbol: '$',
  format: (amount) => `$${amount.toFixed(2)} CAD`
};

export const LOCATION = {
  region: 'Greater Toronto Area',
  country: 'Canada',
  timezone: 'America/Toronto'
};

export const TIME_ZONES = [
  { value: 'America/Toronto', label: 'Eastern Time (Toronto)' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver)' },
  { value: 'America/Edmonton', label: 'Mountain Time (Edmonton)' },
  { value: 'America/Winnipeg', label: 'Central Time (Winnipeg)' }
]; 