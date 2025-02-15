module.exports = {
    "env": {
        "node": true,
        "jest": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2020
    },
    "rules": {
        "no-console": "off",
        "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
}; 