"use client"

import { signOut } from "next-auth/react";
import React from "react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      style={{
        padding: "0.5rem 1rem",
        background: "#e53e3e",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold"
      }}
    >
      Log Out
    </button>
  );
}
