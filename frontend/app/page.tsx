import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default async function HomePage() {
  const sessionData = await authClient.getSession();
  const session = sessionData?.data;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Auth Service</h1>
      {session ? (
        <div>
          <p>Welcome, {session.user.name}!</p>
          <p>Email: {session.user.email}</p>
          <Link href="/dashboard">Go to Dashboard</Link>
          <br />
          <button onClick={() => authClient.signOut()}>Sign Out</button>
        </div>
      ) : (
        <div>
          <Link href="/login">Login</Link>
          <br />
          <Link href="/signup">Sign Up</Link>
        </div>
      )}
    </div>
  );
}
