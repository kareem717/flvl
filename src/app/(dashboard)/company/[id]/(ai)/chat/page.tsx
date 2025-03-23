import { Chat } from "./components/chat";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const companyId = parseInt(id);

  if (isNaN(companyId)) {
    return <div>Invalid company ID</div>;
  }

  return (
    <div className="flex flex-col w-full p-4 h-full">
      <h1 className="text-2xl font-bold mb-4">AI Chat</h1>
      <div className="w-full mx-auto h-full">
        <Chat companyId={companyId} />
      </div>
    </div>
  );
}
