import { KanbanBoard } from '@/components/KanbanBoard';
import { Navigation } from '@/components/Navigation';

export const metadata = {
  title: 'Karzinka Bussines',
  description: 'Karzinka Bussines',
};

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <Navigation />
      <div className="h-[calc(100vh-64px)]">
        <KanbanBoard />
      </div>
    </main>
  );
}
