import { AnalysisDetailView } from './_components/detail-view';
import { Header } from '../../_components/header';

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <AnalysisDetailView id={id} />
      </div>
    </main>
  );
}
