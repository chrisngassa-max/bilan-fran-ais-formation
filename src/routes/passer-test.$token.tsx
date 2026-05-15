import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/passer-test/$token')({
  beforeLoad: () => {
    throw redirect({ to: '/evaluation' });
  },
  component: () => null,
});
