// Draft text for the Privacy policy and Terms of use screens.
// TODO: have the team review this and replace the contact placeholder
// before the demo. This is a draft, not legal advice.

export type LegalSection = {
  heading: string;
  body: string;
};

export type LegalDocument = {
  title: string;
  updated: string;
  sections: LegalSection[];
};

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy policy',
  updated: 'Last updated: October 2026',
  sections: [
    {
      heading: 'What Cape Safe is',
      body: 'Cape Safe is a student project that helps tourists stay safe in Cape Town. This policy explains what information the app uses and why.',
    },
    {
      heading: 'Information we use',
      body: 'Your location, so we can show where you are on the map and let you share it. Your account details, such as your name and email address. Your emergency contacts and any medical notes you choose to save in your profile.',
    },
    {
      heading: 'How we use it',
      body: 'We use this information only to run the features of the app: showing nearby help, letting you call emergency numbers, and sharing your location with the people you choose. We do not sell your information.',
    },
    {
      heading: 'Location',
      body: 'Cape Safe asks for permission before using your location. You can turn this off in your phone settings at any time, but the map and location sharing will not work without it.',
    },
    {
      heading: 'Where it is stored',
      body: 'Account and profile information will be stored using Firebase, a service provided by Google. Only you can read and change your own profile.',
    },
    {
      heading: 'Your rights',
      body: 'You can ask to see, correct or delete your information at any time. This is in line with the South African Protection of Personal Information Act (POPIA).',
    },
    {
      heading: 'Contact',
      body: '[Team contact email to be added]',
    },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  title: 'Terms of use',
  updated: 'Last updated: October 2026',
  sections: [
    {
      heading: 'Using the app',
      body: 'By using Cape Safe you agree to these terms. The app is a student project and is provided as is, without any guarantee that it is complete, accurate or always available.',
    },
    {
      heading: 'Not an emergency service',
      body: 'Cape Safe does not replace emergency services. In an emergency always call 10111 (police), 10177 (ambulance) or 112 (mobile emergency).',
    },
    {
      heading: 'Safety information',
      body: 'Maps, caution areas, tips and alerts are for general guidance only and may be out of date. Use your own judgement and follow advice from local authorities.',
    },
    {
      heading: 'Your account',
      body: 'Keep your login details private. You are responsible for what happens under your account.',
    },
    {
      heading: 'Acceptable use',
      body: 'Do not misuse the app, attempt to break it, or use it to harm or harass others.',
    },
    {
      heading: 'Changes',
      body: 'We may update these terms as the app develops. Continuing to use the app means you accept the updated terms.',
    },
  ],
};
