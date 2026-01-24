import React from "react";
import { Navigate } from "react-router-dom";

export function DashboardPage() {
  return <Navigate to="/results" replace />;
}
