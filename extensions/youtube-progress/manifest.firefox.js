/** Firefox MV3 twin — no externally_connectable; browser_specific_settings for AMO. */
import chromeManifest from './manifest.config.js';

const { externally_connectable: _drop, ...rest } = chromeManifest;

export default {
  ...rest,
  browser_specific_settings: {
    gecko: {
      id: 'youtube-progress@10tracker.com',
      strict_min_version: '121.0',
    },
  },
};
