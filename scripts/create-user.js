async function createAdmin() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000"
      },
      body: JSON.stringify({
        email: "admin@combiphar.com",
        password: "password123",
        name: "System Admin"
      })
    });
    const data = await res.json();
    console.log("Signup response: ", data);
  } catch (error) {
    console.error("Error creating user:", error);
  }
}

createAdmin();
