export default {
  manifest_version: 3,
  name: '10tracker YouTube Progress',
  version: '1.2.2',
  description:
    'Sync watch progress for OG Tracker path videos on 10tracker.com — catalog videos only.',
  icons: {
    16: 'public/icons/icon16.png',
    48: 'public/icons/icon48.png',
    128: 'public/icons/icon128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: '10tracker · YouTube Progress',
    default_icon: {
      16: 'public/icons/icon16.png',
      48: 'public/icons/icon48.png',
      128: 'public/icons/icon128.png',
    },
  },
  background: {
    service_worker: 'src/background/service-worker.js',
    type: 'module',
  },
  permissions: ['storage', 'alarms', 'tabs', 'scripting'],
  web_accessible_resources: [
    {
      resources: ['public/brand/*', 'public/icons/*'],
      matches: [
        'https://www.youtube.com/*',
        'https://youtube.com/*',
        'https://*.10tracker.com/*',
        'https://10tracker.com/*',
      ],
    },
  ],
  host_permissions: [
    'https://www.youtube.com/*',
    'https://youtube.com/*',
    'https://*.10tracker.com/*',
    'https://10tracker.com/*',
  ],
  externally_connectable: {
    matches: ['https://*.10tracker.com/*', 'https://10tracker.com/*'],
  },
  content_scripts: [
    {
      matches: ['https://www.youtube.com/*', 'https://youtube.com/*'],
      js: ['src/content/youtube.js'],
      run_at: 'document_idle',
    },
    {
      matches: ['https://*.10tracker.com/*', 'https://10tracker.com/*'],
      js: ['src/content/presence.js'],
      run_at: 'document_start',
    },
    {
      matches: [
        'https://*.10tracker.com/extension/connected*',
        'https://10tracker.com/extension/connected*',
      ],
      js: ['src/content/connect.js'],
      run_at: 'document_idle',
    },
  ],
};
