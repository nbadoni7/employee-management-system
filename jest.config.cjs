module.exports = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"], // <-- exact file
    transform: { "^.+\\.(js|jsx|ts|tsx)$": "babel-jest" },
    moduleNameMapper: {
        "^.+\\.(css|scss|sass|less)$": "identity-obj-proxy",
        "^.+\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$":
            "<rootDir>/test/__mocks__/fileMock.js",
        "^@/(.*)$": "<rootDir>/src/$1"
    },
    testPathIgnorePatterns: ["/node_modules/", "/dist/"]
};