import type { User, TimeEntry } from './types';

export const users: User[] = [
  { id: '1', name: 'Max Mustermann' },
  { id: '2', name: 'Erika Mustermann' },
  { id: '3', name: 'Sabine Schmidt' },
];

const getISODate = (dayOffset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().split('T')[0];
};

export const initialEntries: TimeEntry[] = [
  {
    id: 'e1',
    date: getISODate(-2),
    customer: 'Kunde A - Webdesign',
    hours: 8,
    userId: '1',
  },
  {
    id: 'e2',
    date: getISODate(-2),
    customer: 'Kunde B - Beratung',
    hours: 2.5,
    userId: '2',
  },
  {
    id: 'e3',
    date: getISODate(-1),
    customer: 'Internes Meeting',
    hours: 1,
    userId: '1',
  },
  {
    id: 'e4',
    date: getISODate(-1),
    customer: 'Kunde C - Projekt-Setup',
    hours: 7,
    userId: '1',
  },
  {
    id: 'e5',
    date: getISODate(0),
    customer: 'Kunde D - Wartung',
    hours: 4.5,
    userId: '1',
  },
  {
    id: 'e6',
    date: getISODate(0),
    customer: 'Kunde A - UI/UX-Konzept',
    hours: 3,
    userId: '2',
  },
];
