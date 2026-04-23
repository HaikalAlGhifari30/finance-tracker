async function seed() {
    const { auth } = await import("../src/lib/auth");
    const { db } = await import("../src/db");
    const { user } = await import("../src/db/schema");
    const { eq } = await import("drizzle-orm");

    const email = "superadmin@example.com";
    const password = "password123";
    const name = "Super Admin";

    console.log("Checking if user exists...");
    const existingUser = await db.select().from(user).where(eq(user.email, email)).execute();
    
    if (existingUser.length > 0) {
        console.log("User already exists. Updating role...");
        await db.update(user).set({ role: "SUPERADMIN" }).where(eq(user.email, email)).execute();
        console.log("Role updated to SUPERADMIN.");
    } else {
        console.log("Creating user...");
        try {
            await auth.api.signUpEmail({
                body: {
                    email,
                    password,
                    name
                }
            });
            console.log("User created via Better Auth.");
            await db.update(user).set({ role: "SUPERADMIN" }).where(eq(user.email, email)).execute();
            console.log("Role set to SUPERADMIN.");
        } catch (e) {
            console.error("Failed to create user:", e);
        }
    }
    process.exit(0);
}

seed();
