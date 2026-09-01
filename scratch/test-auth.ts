import 'dotenv/config';
import { auth } from "../src/lib/auth";

async function test() {
  console.log("Auth initialized successfully:", !!auth);
}

test().catch((err) => {
  console.error("Auth init error:", err);
});
