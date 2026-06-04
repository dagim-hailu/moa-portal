import { seedDatabase } from "../src/db/seed.js";

seedDatabase()
  .then(() => {
    console.log("Database seeded successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
