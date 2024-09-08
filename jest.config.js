module.exports = {
    transform: { '^.+\\.ts?$': 'ts-jest' },
    testRegex: '/src/.*\\.(test|spec)?\\.(ts|tsx)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    modulePathIgnorePatterns: [
        "<rootDir>/dist/"
    ],
    runner: "@kayahr/jest-electron-runner/main",
    testEnvironment: '@kayahr/jest-electron-runner/environment',
    testEnvironmentOptions: {
        electron: {
            options: [
                "no-sandbox",
                "ignore-certificate-errors",
                "force-device-scale-factor=1"
            ],
            disableHardwareAcceleration: false
        }
    }
};