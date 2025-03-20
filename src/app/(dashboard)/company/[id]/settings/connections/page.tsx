import { ConnectionTabs } from "./components/connection-tabs";

export default async function ConnectionsSettingsPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsedId = Number.parseInt(id, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold mb-2">Connections</h1>
        <p className="text-muted-foreground">Manage who ypu</p>
      </div>
      <ConnectionTabs companyId={parsedId} />
    </div>
  );
}
