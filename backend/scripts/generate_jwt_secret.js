const crypto = require("crypto")

const generateSecretKey = () => {
  return crypto.randomBytes(64).toString("hex")
}

const jwtSecretKey = generateSecretKey()
console.log("Your JWT Secret Key:")
console.log(jwtSecretKey)

console.log("\nYou can use this key in your .env file like this:")
console.log("JWT_SECRET=" + jwtSecretKey)

