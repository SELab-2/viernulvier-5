import { prisma } from "./prisma";


/*

This script will sync the database with the api 
run with:
npx tsx scraper.ts
*/

async function main() {
  // Create a new user with a post
    const production = await prisma.production.create({
        data: {
            performer_field :"test"
        },
    });
    console.log("Created production:", production);

    // Fetch all users with their posts
    const allProductions = await prisma.production.findMany();
    console.log("All production:", JSON.stringify(allProductions, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });