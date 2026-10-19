import type { SymbolViewProps } from 'expo-symbols';

export type EmergencyService = {
  id: string;
  /** Name shown on the row. */
  name: string;
  /** Name read out by screen readers, e.g. "SAPS Police". */
  a11yName: string;
  /** Digits only, passed to `tel:`. */
  dial: string;
  /** Number as shown on screen, e.g. "021 596 1999". */
  display: string;
  /** Background colour of the round icon. */
  color: string;
  icon: SymbolViewProps['name'];
};

export const emergencyServices: EmergencyService[] = [
  {
    id: 'saps',
    name: 'SAPS (Police)',
    a11yName: 'SAPS Police',
    dial: '10111',
    display: '10111',
    color: '#2563EB',
    icon: { ios: 'shield.fill', android: 'local_police', web: 'local_police' },
  },
  {
    id: 'metro',
    name: 'Metro Police',
    a11yName: 'Metro Police',
    dial: '0215961999',
    display: '021 596 1999',
    color: '#0891B2',
    icon: { ios: 'car.fill', android: 'shield', web: 'shield' },
  },
  {
    id: 'ambulance',
    name: 'Ambulance',
    a11yName: 'Ambulance',
    dial: '10177',
    display: '10177',
    color: '#DC2626',
    icon: { ios: 'cross.case.fill', android: 'local_hospital', web: 'local_hospital' },
  },
  {
    // TODO(verify): 0861 555 777 is the 24-hour line. Source: Western Cape Government,
    // https://www.westerncape.gov.za/health-wellness/know-who-you-can-call-emergency
    id: 'poisons',
    name: 'Poisons Information Helpline of the Western Cape',
    a11yName: 'Poisons Information Helpline of the Western Cape',
    dial: '0861555777',
    display: '0861 555 777',
    color: '#7C3AED',
    icon: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  },
  {
    // TODO(verify): 021 918 3512 (also 021 918 3449 / 3452). Source: Western Cape Government,
    // https://westerncape.gov.za/service/reporting-missing-person
    // An older 2017 news article quotes 021 467 8236 for the Western Cape bureau, so confirm with SAPS.
    id: 'missing',
    name: 'Bureau of Missing Persons',
    a11yName: 'Bureau of Missing Persons',
    dial: '0219183512',
    display: '021 918 3512',
    color: '#0D9488',
    icon: { ios: 'person.fill.questionmark', android: 'person_search', web: 'person_search' },
  },
  {
    id: 'fire',
    name: 'Fire & Rescue Services',
    a11yName: 'Fire and Rescue Services',
    dial: '0214807700',
    display: '021 480 7700',
    color: '#EA580C',
    icon: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
  },
  {
    // TODO(verify): 087 094 9774 is the NSRI Emergency Operations Centre. Source: NSRI spokesperson
    // Andrew Ingram, EWN, 22 Sept 2026,
    // https://www.ewn.co.za/2026/09/22/nsri-urges-safety-prioritisation-after-uptick-in-coastline-rescue-incidents
    id: 'nsri',
    name: 'National Sea Rescue Institute (NSRI)',
    a11yName: 'National Sea Rescue Institute',
    dial: '0870949774',
    display: '087 094 9774',
    color: '#0369A1',
    icon: { ios: 'lifepreserver.fill', android: 'sailing', web: 'sailing' },
  },
  {
    // TODO(verify): 021 937 0300 is the WSAR emergency number. Source: WSAR statement, 8 April 2026,
    // https://www.goodthingsguy.com/wsar-volunteers-help-hikers-easter/
    id: 'wsar',
    name: 'Wilderness Search & Rescue (WSAR)',
    a11yName: 'Wilderness Search and Rescue',
    dial: '0219370300',
    display: '021 937 0300',
    color: '#15803D',
    icon: { ios: 'mountain.2.fill', android: 'hiking', web: 'hiking' },
  },
];
