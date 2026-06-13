import { Header } from '../_components/header';
import { HistoryList } from './_components/history-list';

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">Analysis History</h1>
          <p className="text-muted-foreground text-sm mt-1">Review previous startup idea evaluations</p>
        </div>
        <HistoryList />
      </div>
    </main>
  );
}
