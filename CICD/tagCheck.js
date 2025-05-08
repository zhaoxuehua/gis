const pkgInfo = require('../package.json')

const CI_COMMIT_TAG = process.env.CI_COMMIT_TAG;
console.info(`CI_COMMIT_TAG: ${CI_COMMIT_TAG}`);
console.info(`npm package version: ${pkgInfo.version}`);

if (CI_COMMIT_TAG !== `npm-${pkgInfo.version}`) {
    throw new Error('tag name should be the same as package version')
}
