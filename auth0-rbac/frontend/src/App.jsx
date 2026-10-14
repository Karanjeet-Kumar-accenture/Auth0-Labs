
import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const {
    isLoading,
    isAuthenticated,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [permissions, setPermissions] = useState([]);
  const [result, setResult] = useState("");

  async function loadPermissions() {
    try {
      const token = await getAccessTokenSilently();
      console.log(token);
      const response = await fetch(`${API_URL}/content`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error);
      }

      setResult(JSON.stringify(data, null, 2));

      // Get the permissions claim from the access token.
      const parts = token.split(".");
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );

      setPermissions(payload.permissions || []);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  }

  async function callApi(path, method = "GET") {
    try {
      const token = await getAccessTokenSilently();

      const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        ...(method === "POST"
          ? { body: JSON.stringify({ content: "Updated announcement" }) }
          : {}),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  }

  if (isLoading) return <p>Loading...</p>;

  if (!isAuthenticated) {
    return (
      <main>
        <h1>Admin Portal</h1>
        <button onClick={() => loginWithRedirect()}>
          Login
        </button>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "Arial", padding: 24 }}>
      <h1>Admin Portal</h1>

      <p>Welcome, {user.name}</p>
      <p>{user.email}</p>

      <button onClick={loadPermissions}>
        Load content and permissions
      </button>

      {permissions.includes("read:content") && (
        <button onClick={() => callApi("/content")}>
          View Content
        </button>
      )}

      {permissions.includes("edit:content") && (
        <button onClick={() => callApi("/content", "POST")}>
          Edit Content
        </button>
      )}

      {permissions.includes("manage:users") && (
        <button onClick={() => callApi("/admin/users")}>
          Manage Users
        </button>
      )}

      <pre>{result}</pre>

      <button
        onClick={() =>
          logout({
            logoutParams: { returnTo: window.location.origin },
          })
        }
      >
        Logout
      </button>
    </main>
  );
}
