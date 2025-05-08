import { SecureCodePlayground } from "./components/SecureCodePlayground";

/**
 * Example App
 *
 * Simple wrapper that embeds the SecureCodePlayground component.
 */
function App() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Secure JS Analyzer Playground</h1>
      <SecureCodePlayground />
    </div>
  );
}

export default App;
