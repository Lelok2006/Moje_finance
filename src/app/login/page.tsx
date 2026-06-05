import { Suspense } from "react";
import LoginForm from "./LoginForm";

// Prepreči statično predgeneracijo — stran je vedno dinamična
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
