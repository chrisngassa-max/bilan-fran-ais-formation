import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/financement")({
  component: FinancementLayout,
});

function FinancementLayout() {
  return (
    <>
      <Outlet />
    </>
  );
}
