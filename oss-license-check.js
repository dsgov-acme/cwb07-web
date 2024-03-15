var checker = require('license-checker');
const dsgovWebVersion = require('./package.json').version;
const sharedThemeVersion = require('./libs/shared/ui/theme/package.json').version;

checker.init(
  {
    start: __dirname,
    production: true,
    onlyAllow: [
      'Apache-2.0',
      'BlueOak-1.0.0',
      'BSD',
      'BSD-2-Clause',
      'BSD-3-Clause',
      'CC0-1.0',
      'CC-BY-3.0',
      'CC-BY-4.0',
      'ISC',
      'MIT',
      'Public Domain',
      'Python-2.0',
      'Unlicense',
      'WTFPL',
    ].join(';'),
    excludePackages: [`dsgov-web@${dsgovWebVersion}`, `@dsg/shared-theme@${sharedThemeVersion}`].join(';'),
  },
  function (err, packages) {
    if (err) {
      console.error('Error running OSS license check: ', err);
      process.exitCode = 1;
    } else {
      console.log(checker.asSummary(packages));
    }
  },
);
