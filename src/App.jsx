import ViewerV2 from './components/ViewerV2.jsx';
import ViewerV1 from './components/ViewerV1.jsx';

export default function App() {
  return (
    <main>
      <section className="viewer-v2-shell">
        <ViewerV1 />
      </section>
    </main>
  );
}
