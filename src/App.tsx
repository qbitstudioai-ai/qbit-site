import { QbitAnalyticsRoot } from "./analytics/QbitAnalyticsRoot";
import { AdminLoginGate } from "./components/AdminLoginGate";
import { MainSite } from "./MainSite";
import { useHashAdmin } from "./useHashAdmin";

function App() {
  const isAdmin = useHashAdmin();
  if (isAdmin) {
    return <AdminLoginGate />;
  }
  return (
    <>
      <QbitAnalyticsRoot />
      <MainSite />
    </>
  );
}

export default App;
